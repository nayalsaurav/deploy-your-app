import { Worker, Job } from "bullmq"
import { NotificationService } from "./services/notification.service"

export * from "./services/notification.service"

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
}

export interface NotificationJobData {
  type: "email" | "discord" | "slack" | "whatsapp"
  payload: any
}

const worker = new Worker<NotificationJobData>(
  "notification-queue",
  async (job: Job<NotificationJobData>) => {
    console.log(
      `Processing notification job ${job.id} of type ${job.data.type}`
    )
    const { type, payload } = job.data

    try {
      switch (type) {
        case "email":
          await NotificationService.sendEmail(
            payload.to,
            payload.subject,
            payload.html
          )
          break
        case "discord":
          await NotificationService.sendDiscord(payload.message)
          break
        case "slack":
          await NotificationService.sendSlack(payload.message)
          break
        case "whatsapp":
          await NotificationService.sendWhatsApp(payload.to, payload.message)
          break
        default:
          console.warn(`Unknown notification type: ${type}`)
      }
      console.log(`Successfully processed notification job ${job.id}`)
    } catch (error) {
      console.error(`Failed to process notification job ${job.id}:`, error)
      throw error
    }
  },
  {
    connection,
    prefix: "launchdrop",
  }
)

worker.on("ready", () => {
  console.log("Notification worker is ready and waiting for jobs.")
})

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with error ${err.message}`)
})
