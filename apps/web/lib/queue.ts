import { Queue } from "bullmq";
import Redis from "ioredis";

const redis = new Redis();

export const queue = new Queue("hakuro-queue", { connection: redis });