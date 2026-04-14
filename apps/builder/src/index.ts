import { Worker } from "bullmq"
import { redisConnection } from "./config"
import { payloadSchema } from "./types"
import { cloneRepo } from "./services/git.service"
import { logger } from "./utils/logger"

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

    await job.updateProgress(10)

    const cloneResult = await cloneRepo({
      repo: data.repo,
      branch: data.branch,
      token: data.token,
    })

    try {
      await job.updateProgress(40)
      logger.info(
        { jobId: job.id, path: cloneResult.path },
        "Repository cloned successfully"
      )

      //   const buildResult = await buildTheProject(cloneResult.path, data)
      // await job.updateProgress(70)

      // const deployResult = await deployTheProject(data)
      // await job.updateProgress(100)

      await job.updateProgress(100)
    } finally {
      // Always clean up temp directory regardless of success or failure
      await cloneResult.cleanup()
    }
  },
  {
    connection: redisConnection,
    concurrency: Number(process.env.WORKER_CONCURRENCY) || 1,
    prefix: "launchdrop",
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
