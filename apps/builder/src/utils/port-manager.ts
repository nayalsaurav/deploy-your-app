import Redis from "ioredis"
import { redisConnection } from "../config"

const redis = new Redis(redisConnection)

export const PORT_RANGE_START = 5000
export const PORT_RANGE_END = 5100
const USED_PORTS_KEY = "launchdrop:used_ports"

export async function findAvailablePort(): Promise<number> {
  for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
    const added = await redis.sadd(USED_PORTS_KEY, port)
    if (added === 1) {
      return port
    }
  }

  throw new Error("No available ports found in the configured range")
}

export async function releasePort(port: number): Promise<void> {
  await redis.srem(USED_PORTS_KEY, port)
}
