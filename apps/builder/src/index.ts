import { Worker } from "bullmq"
import { redisConnection, redisPublisher } from "./config"
import { payloadSchema } from "./types"
import { cloneRepo } from "./services/git.service"
import { logger } from "./utils/logger"
import { buildAndProcessDeployment } from "./services/docker.service"
import { uploadFolderToR2 } from "./services/upload.service"
import {
  performFullCleanup,
  cleanupDockerResources,
} from "./services/cleanup.service"
import { findAvailablePort, releasePort } from "./utils/port-manager"
import { prisma } from "@workspace/database"
import { generateUniqueSubdomain } from "./utils/domain-generator"

import { publishLog, updateDeployment } from "./utils/utils"

export const worker = new Worker(
  "execution-queue",
  async (job) => {
    // ---------- Step 0: Validate ----------
    const parsed = payloadSchema.safeParse(job.data)

    if (!parsed.success) {
      logger.error({ jobId: job.id, error: parsed.error }, "Invalid job data")
      throw new Error("Invalid job data")
    }

    const data = parsed.data
    const deploymentId = data.deploymentId

    let logBuffer = ""
    let allocatedPort: number | undefined
    let repo: any
    let buildResult: any | undefined

    logger.info({ jobId: job.id, deploymentId }, "Job started")
    await publishLog(deploymentId, "[SYSTEM] Starting deployment...\n")

    try {
      // ---------- Step 1: Clone ----------
      await updateDeployment(deploymentId, { status: "CLONING" })
      await job.updateProgress(10)

      repo = await cloneRepo({
        repo: data.repo,
        branch: data.branch,
        token: data.token,
        deploymentId,
      })

      logBuffer += repo.logs

      if (!repo.success) {
        throw new Error(repo.message)
      }

      await publishLog(deploymentId, "[SYSTEM] Repository cloned\n")

      // ---------- Step 2: Build ----------
      await updateDeployment(deploymentId, { status: "BUILDING" })
      await job.updateProgress(40)

      allocatedPort = await findAvailablePort()

      buildResult = await buildAndProcessDeployment(
        repo.path,
        allocatedPort,
        deploymentId,
        600_000
      )

      logBuffer += buildResult.buildLogs

      if (!buildResult.success) {
        throw new Error(
          (buildResult.error || "Build failed") +
            "\n" +
            (buildResult.buildLogs || "")
        )
      }

      await publishLog(deploymentId, "[SYSTEM] Build completed\n")

      // ---------- Step 3: Upload (if static) ----------
      if (buildResult.outputPath) {
        await publishLog(
          deploymentId,
          "[SYSTEM] Uploading static files to R2...\n"
        )

        const uploaded = await uploadFolderToR2(
          buildResult.outputPath,
          deploymentId
        )

        if (!uploaded) {
          throw new Error("Failed to upload static files to R2")
        }

        // ---------- Step 3.1: Cleanup Docker for static site ----------
        await cleanupDockerResources(
          buildResult.containerId,
          buildResult.imageName
        )
      }

      // ---------- Step 4: Finalize ----------
      let project = await prisma.project.findUnique({
        where: { id: data.projectId },
      })

      const oldMetadata = project?.metadata as {
        containerId?: string
        imageName?: string
      } | null

      let domain = project?.deploymentUrl
      const baseDomain = process.env.BASE_DOMAIN || "localhost"

      if (!domain) {
        const subdomain = await generateUniqueSubdomain(data.repoName)
        domain = `${subdomain}.${baseDomain}`
      } else if (!domain.includes(".")) {
        domain = `${domain}.${baseDomain}`
      }

      await updateDeployment(deploymentId, {
        status: "SUCCESS",
        port: buildResult.outputPath ? null : allocatedPort,
        url: domain,
        logs: logBuffer,
        completedAt: new Date(),
      })

      await prisma.project.update({
        where: { id: data.projectId },
        data: {
          deploymentUrl: domain,
          metadata: {
            containerId: buildResult.containerId,
            imageName: buildResult.imageName,
            isStatic: !!buildResult.outputPath,
            r2Path: buildResult.outputPath
              ? `deployments/${deploymentId}`
              : null,
          },
        },
      })

      // ---------- Step 5: Clean up old deployment container if exists ----------
      if (
        oldMetadata?.containerId &&
        oldMetadata.containerId !== buildResult.containerId
      ) {
        await publishLog(
          deploymentId,
          "[SYSTEM] Stopping previous deployment container...\n"
        )
        logger.info(
          { oldContainerId: oldMetadata.containerId },
          "Cleaning up previous deployment container"
        )
        await cleanupDockerResources(
          oldMetadata.containerId,
          oldMetadata.imageName
        )
      }

      await job.updateProgress(100)
    } catch (error) {
      if (allocatedPort) {
        await releasePort(allocatedPort)
      }

      // Cleanup everything on failure
      await performFullCleanup({
        deploymentId,
        repoPath: repo?.path,
        containerId: buildResult?.containerId,
        imageName: buildResult?.imageName,
        forceRemoveImage: true,
      })

      logger.error({ jobId: job.id, deploymentId, error }, "Job failed")

      await publishLog(deploymentId, `[SYSTEM] ERROR: ${String(error)}\n`)

      await updateDeployment(deploymentId, {
        status: "FAILED",
        error: String(error),
        logs: logBuffer,
        completedAt: new Date(),
      }).catch((err) => logger.error({ err }, "Failed to update DB"))

      throw error
    } finally {
      await performFullCleanup({
        deploymentId,
        repoPath: repo?.path,
      })

      logger.info({ jobId: job.id }, "Job finished (clearing workspace)")
    }
  },
  {
    connection: redisConnection,
    concurrency: Number(process.env.WORKER_CONCURRENCY) || 1,
    prefix: "launchdrop",
    lockDuration: 300000,
  }
)

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Job completed")
})

worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Job failed")
})

const shutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down...`)
  await worker.close()
  process.exit(0)
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)

logger.info("Worker is running...")
