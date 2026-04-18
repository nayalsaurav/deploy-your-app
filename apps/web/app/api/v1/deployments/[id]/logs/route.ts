import { NextRequest } from "next/server"
import { Redis } from "ioredis"

const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const subscriber = new Redis({
        ...redisConnection,
        lazyConnect: true
      })
      await subscriber.connect().catch(console.error)

      subscriber.subscribe(`logs:${id}`, (err) => {
        if (err) console.error(`Failed to subscribe to logs:${id}`, err)
      })

      subscriber.on("message", (channel, message) => {
        if (channel === `logs:${id}`) {
          const payload = JSON.stringify({ text: message })
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
        }
      })
      req.signal.addEventListener("abort", () => {
        subscriber.disconnect()
        try { controller.close() } catch (e) { }
      })
    },
    cancel() {
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  })
}
