import { PutObjectCommand } from "@aws-sdk/client-s3"
import { s3Client, R2_BUCKET_NAME } from "../config"
import fs from "node:fs/promises"
import { join, relative } from "node:path"
import { logger } from "../utils/logger"
import { publishLog } from "../utils/utils"

/* ---------------- Content Type ---------------- */

function getContentType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || ""

  const mimeMap: Record<string, string> = {
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    ico: "image/x-icon",
    txt: "text/plain",
    xml: "application/xml",
    pdf: "application/pdf",
  }

  return mimeMap[ext] || "application/octet-stream"
}

/* ---------------- File Discovery ---------------- */

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(dir, entry.name)
      return entry.isDirectory()
        ? collectFiles(fullPath)
        : [fullPath]
    })
  )

  return files.flat()
}

/* ---------------- Upload ---------------- */

export async function uploadFolderToR2(
  folderPath: string,
  deploymentId: string
): Promise<boolean> {
  try {
    const files = await collectFiles(folderPath)

    logger.info(
      { count: files.length, deploymentId },
      "Starting R2 upload"
    )

    publishLog(
      deploymentId,
      `[SYSTEM] Uploading ${files.length} files to R2...\n`
    )

    const chunkSize = 20

    // Process in chunks (REAL throttling)
    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize)

      await Promise.all(
        chunk.map(async (filePath) => {
          const relativePath = relative(folderPath, filePath)
          const key = `deployments/${deploymentId}/${relativePath.replace(/\\/g, "/")}`

          const body = await fs.readFile(filePath)

          await s3Client.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: key,
              Body: body,
              ContentType: getContentType(filePath),
            })
          )

          logger.debug({ key }, "Uploaded file")
        })
      )

      const progress = Math.min(
        ((i + chunk.length) / files.length) * 100,
        100
      )

      logger.info(
        { progress: progress.toFixed(2), deploymentId },
        "Upload progress"
      )
    }

    logger.info({ deploymentId }, "Upload completed")

    publishLog(
      deploymentId,
      `[SYSTEM] Static assets uploaded to R2.\n`
    )

    return true
  } catch (error) {
    logger.error({ error, deploymentId }, "Upload failed")

    publishLog(
      deploymentId,
      `[SYSTEM] ERROR: Upload failed: ${String(error)}\n`
    )

    return false
  }
}