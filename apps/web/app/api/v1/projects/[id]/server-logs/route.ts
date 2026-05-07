import { NextRequest } from "next/server"
import { Redis } from "ioredis"
import { spawn, ChildProcess } from "node:child_process"
import { prisma } from "@workspace/database"

const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    return new Response("Project not found", { status: 404 })
  }

  const metadata = project.metadata as { containerId?: string } | null
  const containerId = metadata?.containerId

  if (!containerId) {
    return new Response("No container ID found for this project", { status: 404 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const subscriber = new Redis({ ...redisConnection, lazyConnect: true })
      const publisher = new Redis({ ...redisConnection, lazyConnect: true })

      let dockerProcess: ChildProcess | null = null
      let heartbeatInterval: NodeJS.Timeout | null = null
      let isPublisher = false

      await Promise.all([
        subscriber.connect().catch(console.error),
        publisher.connect().catch(console.error),
      ])

      const lockKey = `active-logger:${containerId}`
      const channel = `server-logs:${containerId}`

      // Subscribe to logs
      subscriber.subscribe(channel, (err) => {
        if (err) console.error(`Failed to subscribe to ${channel}`, err)
      })

      subscriber.on("message", (ch, message) => {
        if (ch === channel) {
          const payload = JSON.stringify({ text: message })
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
        }
      })

      // Publisher election logic
      const tryBecomePublisher = async () => {
        if (isPublisher) {
          // Just renew lock
          await publisher.expire(lockKey, 10).catch(() => {})
          return
        }

        // Try to become publisher
        const acquired = await publisher.set(lockKey, "1", "EX", 10, "NX")

        if (acquired === "OK") {
          isPublisher = true

          dockerProcess = spawn("docker", [
            "logs",
            "-f",
            "--tail",
            "100",
            containerId,
          ])

          dockerProcess.stdout?.on("data", (data) => {
            publisher.publish(channel, data.toString()).catch(() => {})
          })

          dockerProcess.stderr?.on("data", (data) => {
            publisher.publish(channel, data.toString()).catch(() => {})
          })

          dockerProcess.on("close", () => {
            isPublisher = false
            publisher.del(lockKey).catch(() => {})
          })

          dockerProcess.on("error", (err) => {
            console.error("Docker logs process error:", err)
            isPublisher = false
          })
        }
      }

      // Initial check and periodic heartbeat
      tryBecomePublisher()
      heartbeatInterval = setInterval(tryBecomePublisher, 5000)

      req.signal.addEventListener("abort", () => {
        if (heartbeatInterval) clearInterval(heartbeatInterval)
        subscriber.disconnect()

        if (isPublisher) {
          if (dockerProcess) dockerProcess.kill()
          publisher.del(lockKey).catch(() => {})
        }

        publisher.disconnect()
        try {
          controller.close()
        } catch (e) {}
      })
    },
    cancel() {},
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  })
}
