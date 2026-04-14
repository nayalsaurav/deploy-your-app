import { executionQueue } from "@workspace/queue"
import { Worker } from "bullmq"
import { connection } from "./config"
import { payloadSchema } from "./types"

const worker = new Worker(
  "deployment-queue",
  async (job) => {
    const parsedData = payloadSchema.safeParse(job.data)

    if (!parsedData.success) {
      console.error("Invalid job data", parsedData.error)
      throw new Error("Invalid job data")
    }

    const data = parsedData.data

    console.log({
      message: "Dispatching job to execution queue",
      jobId: job.id,
      deploymentId: data.deploymentId,
    })

    try {
      await executionQueue.add("execute-build", data)

      return { status: "dispatched" }
    } catch (err) {
      console.error("Dispatch failed", err)
      throw err
    }
  },
  {
    connection,
    concurrency: 1,
    prefix: "launchdrop",
  }
)

worker.on("completed", (job) => {
  console.log(`Job ${job.id} done`)
})

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed`, err)
})

console.log("Worker is running and waiting for jobs...")
