import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"
import { BASE_DOMAIN, PORT, R2_PUBLIC_URL } from "./env"
import { resolveDeployment } from "./services/deployment"
import { serveStaticFromR2 } from "./handlers/r2"
import { serveContainer } from "./handlers/container"

const app = express()

app.get("/_internal/tls-check", async (req, res) => {
  const domain = req.query.domain as string
  if (!domain) return res.status(400).send("Bad Request")
  if (domain === BASE_DOMAIN || domain.endsWith("." + BASE_DOMAIN)) {
    return res.status(200).send("OK")
  }
  const deployment = await resolveDeployment(domain)
  return deployment
    ? res.status(200).send("OK")
    : res.status(404).send("Not Found")
})

app.use(async (req, res, next) => {
  const hostname = req.headers.host?.split(":")[0] ?? ""

  if (hostname === BASE_DOMAIN || !hostname.endsWith("." + BASE_DOMAIN)) {
    return res.status(404).json({ error: "Not found" })
  }

  try {
    const deployment = await resolveDeployment(hostname)

    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" })
    }

    if (deployment.port) {
      return serveContainer(deployment.port, hostname, req, res, next)
    }

    return await serveStaticFromR2(deployment.id, req, res)
  } catch (err) {
    console.error("[proxy] unhandled error:", err)
    next(err)
  }
})

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[proxy] fatal:", err)
    res.status(500).json({ error: "Internal Server Error" })
  }
)

const server = app.listen(PORT, () => {
  console.log("🚀 Proxy server running on port " + PORT)
  console.log("   Base domain : " + BASE_DOMAIN)
  console.log("   R2 URL      : " + R2_PUBLIC_URL)
})

server.on("upgrade", async (req, socket, head) => {
  const hostname = req.headers.host?.split(":")[0] ?? ""

  try {
    const deployment = await resolveDeployment(hostname)

    if (!deployment?.port) {
      console.warn(
        "[proxy] WS upgrade rejected — no container for " + hostname
      )
      socket.destroy()
      return
    }

    const proxy = createProxyMiddleware({
      target: "http://localhost:" + deployment.port,
      ws: true,
      changeOrigin: true,
    })

    // @ts-ignore
    proxy.upgrade?.(req, socket, head)
  } catch (err) {
    console.error("[proxy] WS upgrade error:", err)
    socket.destroy()
  }
})
