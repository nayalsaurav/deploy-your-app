import { Worker } from "bullmq"
import { redisConnection, redisPublisher } from "./config"
import { payloadSchema } from "./types"
import { cloneRepo } from "./services/git.service"
import { logger } from "./utils/logger"
import { buildAndProcessDeployment, cleanupTempBuilds } from "./services/docker.service"
import { findAvailablePort, releasePort } from "./utils/port-manager"
import { prisma } from "@workspace/database"

const streamLog = (deploymentId: string, message: string) => {
  redisPublisher.publish(`logs:${deploymentId}`, `[SYSTEM] ${message}\n`).catch(() => { })
}

export const worker = new Worker(
  "execution-queue",
  async (job) => {
    const parsedData = payloadSchema.safeParse(job.data)

    if (!parsedData.success) {
      logger.error(
        { jobId: job.id, error: parsedData.error },
        "Invalid job data"
      )
      throw new Error("Invalid job data")
    }

    const data = parsedData.data

    logger.info(
      { jobId: job.id, deploymentId: data.deploymentId },
      "Executing job"
    )
    streamLog(data.deploymentId, "Initializing deployment sequence...")

    await prisma.deployment.update({
      where: { id: data.deploymentId },
      data: { status: "CLONING" },
    })

    await job.updateProgress(10)

    logger.info(
      { jobId: job.id, repo: data.repo },
      "Starting repository clone..."
    )
    streamLog(data.deploymentId, `Cloning remote repository ${data.repo}...`)
    const cloneResult = await cloneRepo({
      repo: data.repo,
      branch: data.branch,
      token: data.token,
    })
    logger.info(
      { jobId: job.id, path: cloneResult.path },
      "Repository cloned successfully"
    )
    streamLog(data.deploymentId, "Repository footprint cloned.")

    let targetPort: number | undefined

    try {
      await job.updateProgress(40)

      targetPort = await findAvailablePort()

      logger.info(
        { jobId: job.id, deploymentId: data.deploymentId, targetPort },
        "Starting project build..."
      )
      streamLog(data.deploymentId, "Spawning builder engine...")

      await prisma.deployment.update({
        where: { id: data.deploymentId },
        data: { status: "BUILDING" },
      })
      const buildResult = await buildAndProcessDeployment(
        cloneResult.path,
        targetPort,
        data.deploymentId,
        600_000,
        (chunk) => {
          redisPublisher.publish(`logs:${data.deploymentId}`, chunk).catch(() => { })
        }
      )

      if (!buildResult.success) {
        throw new Error(
          (buildResult.error || "Failed to process deployment") +
          "\\n" +
          (buildResult.buildLogs || "")
        )
      }

      logger.info(
        { jobId: job.id, deploymentId: data.deploymentId, buildResult },
        "Project build completed successfully"
      )
      streamLog(data.deploymentId, "Project build confirmed via Docker service.")

      await prisma.deployment.update({
        where: { id: data.deploymentId },
        data: {
          status: "SUCCESS",
          port: targetPort,
          logs: buildResult.buildLogs,
          completedAt: new Date(),
        },
      })

      await prisma.project.update({
        where: { id: data.projectId },
        data: {
          metadata: {
            containerId: buildResult.containerId,
            imageName: buildResult.imageName,
          },
        },
      })

      // await job.updateProgress(70)

      // const deployResult = await deployTheProject(data)
      // await job.updateProgress(100)

      await job.updateProgress(100)
    } catch (error) {
      if (targetPort) {
        logger.info(
          { jobId: job.id, deploymentId: data.deploymentId, targetPort },
          "Releasing port due to failure"
        )
        await releasePort(targetPort)
      }
      logger.error(
        { jobId: job.id, deploymentId: data.deploymentId, error },
        "Job execution failed"
      )
      streamLog(data.deploymentId, `CRITICAL ERROR: ${String(error)}`)

      await prisma.deployment.update({
        where: { id: data.deploymentId },
        data: {
          status: "FAILED",
          error: String(error),
          completedAt: new Date(),
        },
      }).catch(err => logger.error({ err }, "Could not update db to FAILED"))

      throw error
    } finally {
      // Always clean up temp directory regardless of success or failure
      logger.info(
        { jobId: job.id, path: cloneResult.path },
        "Cleaning up cloned repository..."
      )
      await cloneResult.cleanup()
      await cleanupTempBuilds(data.deploymentId)
      logger.info(
        { jobId: job.id, path: cloneResult.path },
        "Cleanup completed"
      )
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
  logger.info(
    { jobId: job.id, deploymentId: job.data?.deploymentId },
    "Job completed"
  )
})

worker.on("failed", (job, err) => {
  logger.error(
    { jobId: job?.id, deploymentId: job?.data?.deploymentId, err },
    "Job failed"
  )
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down worker...")
  await worker.close()
  process.exit(0)
})

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down worker...")
  await worker.close()
  process.exit(0)
})

logger.info("Execution Worker is running and waiting for jobs...")
