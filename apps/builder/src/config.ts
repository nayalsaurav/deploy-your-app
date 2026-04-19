import { Redis } from "ioredis"
import { S3Client } from "@aws-sdk/client-s3"

export const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
}

export const redisPublisher = new Redis(redisConnection)

export const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
})

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || ""
