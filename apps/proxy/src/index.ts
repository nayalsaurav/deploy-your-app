import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"
import mime from "mime-types"
import path from "path"
import { prisma } from "@workspace/database"

const app = express()

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!.replace(/\/$/, "")
const BASE_DOMAIN = process.env.BASE_DOMAIN!

function getHostname(req: express.Request): string {
  const host = req.headers.host ?? ""
  return host.split(":")[0] ?? ""
}

async function resolveProject(hostname: string) {
  if (!hostname.endsWith(`.${BASE_DOMAIN}`)) return null
  const subdomain = hostname.slice(0, -`.${BASE_DOMAIN}`.length)
  if (!subdomain || subdomain.includes(".")) return null

  console.log(
    `[proxy] resolving subdomain: "${subdomain}" from hostname: "${hostname}"`
  )

  const deployment = await prisma.deployment.findFirst({
    where: {
      OR: [
        { id: subdomain },
        { url: { startsWith: subdomain } },
        { project: { deploymentUrl: { startsWith: subdomain } } },
      ],
      status: "SUCCESS",
    },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      port: true,
      project: { select: { id: true } },
    },
  })

  console.log(`[proxy] resolved:`, deployment)
  return deployment ?? null
}

app.get("/_internal/tls-check", async (req, res) => {
  const domain = req.query.domain as string
  if (!domain) return res.status(400).send("Bad Request")
  if (domain === BASE_DOMAIN) return res.status(200).send("OK")
  if (domain.endsWith(`.${BASE_DOMAIN}`)) return res.status(200).send("OK")
  const deployment = await resolveProject(domain)
  if (deployment) return res.status(200).send("OK")
  return res.status(404).send("Not Found")
})

app.use(async (req, res, next) => {
  const hostname = getHostname(req)

  if (hostname === BASE_DOMAIN || !hostname.endsWith(`.${BASE_DOMAIN}`)) {
    return res.status(404).json({ error: "Not found" })
  }

  try {
    const deployment = await resolveProject(hostname)

    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" })
    }

    const { port } = deployment

    if (port) {
      return createProxyMiddleware({
        target: `http://localhost:${port}`,
        changeOrigin: true,
        ws: true,
        on: {
          error: (err, req, res) => {
            console.error(
              `[launchdrop-proxy] Error proxying to port ${port}:`,
              err.message
            )
            if ("headersSent" in res && !res.headersSent) {
              ;(res as express.Response).status(502).json({
                error: "Bad Gateway",
                detail: "The application is not responding.",
              })
            }
          },
          proxyReq: (proxyReq) => {
            proxyReq.setHeader("X-Forwarded-Host", hostname)
            proxyReq.setHeader("X-Forwarded-Proto", "https")
          },
        },
      })(req, res, next)
    }

    const urlPath = req.path === "/" ? "/index.html" : req.path
    const r2Key = `deployments/${deployment.id}${urlPath}`
    const spaFallbackKey = `deployments/${deployment.id}/index.html`

    await serveFromR2(r2Key, urlPath, res, async () => {
      if (!path.extname(req.path)) {
        await serveFromR2(spaFallbackKey, "/index.html", res, () => {
          res.status(404).json({ error: "File not found" })
          return Promise.resolve()
        })
      } else {
        res.status(404).json({ error: "File not found" })
      }
    })
  } catch (err) {
    console.error("[proxy] Unhandled error:", err)
    next(err)
  }
})

async function serveFromR2(
  r2Key: string,
  urlPath: string,
  res: express.Response,
  onNotFound: () => Promise<void>
): Promise<void> {
  const url = `${R2_PUBLIC_URL}/${r2Key}`
  console.log(`[r2] fetching: ${url}`)

  const r2Res = await fetch(url)

  if (r2Res.status === 404 || r2Res.status === 403) {
    console.log(`[r2] not found (${r2Res.status}): ${url}`)
    return onNotFound()
  }

  if (!r2Res.ok) {
    throw new Error(`R2 responded ${r2Res.status} for key: ${r2Key}`)
  }

  const ext = path.extname(urlPath).toLowerCase()
  const r2ContentType = r2Res.headers.get("content-type") ?? ""
  const contentType =
    r2ContentType && r2ContentType !== "application/octet-stream"
      ? r2ContentType
      : (mime.lookup(ext) as string) || "application/octet-stream"

  const isHtml = contentType.includes("text/html")

  res.setHeader("Content-Type", contentType)
  res.setHeader(
    "Cache-Control",
    isHtml ? "public, no-cache" : "public, max-age=31536000, immutable"
  )
  res.setHeader("X-Served-By", "launchdrop-proxy")

  const etag = r2Res.headers.get("etag")
  const lastModified = r2Res.headers.get("last-modified")
  const contentLength = r2Res.headers.get("content-length")
  if (etag) res.setHeader("ETag", etag)
  if (lastModified) res.setHeader("Last-Modified", lastModified)
  if (contentLength) res.setHeader("Content-Length", contentLength)

  if (!r2Res.body) {
    res.end()
    return
  }

  const reader = r2Res.body.getReader()
  const pump = async (): Promise<void> => {
    const { done, value } = await reader.read()
    if (done) {
      res.end()
      return
    }
    res.write(value)
    return pump()
  }

  res.on("close", () => reader.cancel())
  await pump()
}

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[proxy] Error:", err)
    res.status(500).json({ error: "Internal Server Error" })
  }
)

const PORT = parseInt(process.env.PORT || "8080", 10)

const server = app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`)
  console.log(`   Base domain:  ${BASE_DOMAIN}`)
  console.log(`   R2 URL:       ${R2_PUBLIC_URL}`)
})

server.on("upgrade", (req, socket, head) => {
  const hostname = req.headers.host?.split(":")[0] ?? ""
  resolveProject(hostname).then((deployment) => {
    if (deployment?.port) {
      const proxy = createProxyMiddleware({
        target: `http://localhost:${deployment.port}`,
        ws: true,
        changeOrigin: true,
      })
      // @ts-ignore
      proxy.upgrade?.(req, socket, head)
    } else {
      socket.destroy()
    }
  })
})
