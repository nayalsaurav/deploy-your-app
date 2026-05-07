import express from "express"
import mime from "mime-types"
import path from "path"
import { R2_PUBLIC_URL } from "../env"

function resolveContentType(urlPath: string, r2ContentType: string): string {
  if (r2ContentType && r2ContentType !== "application/octet-stream") {
    return r2ContentType
  }
  const ext = path.extname(urlPath).toLowerCase()
  return (mime.lookup(ext) || "application/octet-stream") as string
}

async function fetchAndSendR2(
  r2Key: string,
  urlPath: string,
  res: express.Response
): Promise<boolean> {
  const url = `${R2_PUBLIC_URL}/${r2Key}`
  console.log(`[r2] GET ${url}`)

  const r2Res = await fetch(url)

  if (r2Res.status === 404 || r2Res.status === 403) {
    console.log(`[r2] miss (${r2Res.status}): ${url}`)
    return false
  }

  if (!r2Res.ok) {
    throw new Error(`R2 error ${r2Res.status} for key: ${r2Key}`)
  }

  const r2ContentType = r2Res.headers.get("content-type") ?? ""
  const contentType = resolveContentType(urlPath, r2ContentType)
  const isHtml = contentType.includes("text/html")

  res.setHeader("Content-Type", contentType)

  res.setHeader(
    "Cache-Control",
    isHtml ? "public, no-store" : "public, max-age=31536000, immutable"
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
    return true
  }

  const buffer = Buffer.from(await r2Res.arrayBuffer())
  res.send(buffer)
  return true
}

export async function serveStaticFromR2(
  deploymentId: string,
  req: express.Request,
  res: express.Response
): Promise<void> {
  const urlPath = req.path === "/" ? "/index.html" : req.path
  const primaryKey = `deployments/${deploymentId}${urlPath}`

  const served = await fetchAndSendR2(primaryKey, urlPath, res)
  if (served) return

  if (!path.extname(req.path)) {
    const fallbackKey = `deployments/${deploymentId}/index.html`
    const fallbackServed = await fetchAndSendR2(fallbackKey, "/index.html", res)
    if (fallbackServed) return
  }

  res.status(404).json({ error: "File not found" })
}
