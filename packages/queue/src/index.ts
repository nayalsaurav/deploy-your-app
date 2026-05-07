import { Queue } from "bullmq"

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
}

const defaultOptions = {
  attempts: 1,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: true,
  removeOnFail: 1000,
  timeout: 1000 * 60 * 15,
}

export const deploymentQueue = new Queue("deployment-queue", {
  connection,
  prefix: "launchdrop",
  defaultJobOptions: defaultOptions,
})

export const executionQueue = new Queue("execution-queue", {
  connection,
  prefix: "launchdrop",
  defaultJobOptions: defaultOptions,
})

export const notificationQueue = new Queue("notification-queue", {
  connection,
  prefix: "launchdrop",
  defaultJobOptions: defaultOptions,
})
