import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"

export function serveContainer(
  port: number,
  hostname: string,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const proxy = createProxyMiddleware({
    target: `http://localhost:${port}`,
    changeOrigin: true,
    ws: true,
    on: {
      error: (err, _req, res) => {
        console.error(`[proxy] container port ${port} error:`, err.message)
        if ("headersSent" in res && !res.headersSent) {
          ;(res as express.Response).status(502).json({
            error: "Bad Gateway",
            detail: "The application container is not responding.",
          })
        }
      },
      proxyReq: (proxyReq) => {
        proxyReq.setHeader("X-Forwarded-Host", hostname)
        proxyReq.setHeader("X-Forwarded-Proto", "https")
      },
      proxyRes: (proxyRes, _req, _res) => {
        delete proxyRes.headers["transfer-encoding"]
      },
    },
  })

  proxy(req, res, next)
}
