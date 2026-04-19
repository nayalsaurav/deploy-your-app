import { exec, spawn } from "node:child_process"
import { promisify } from "node:util"
import { writeFile, mkdir } from "node:fs/promises"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import os from "node:os"
import fs from "node:fs"

import { detectBuildTools } from "../utils/detect"
import { logger } from "../utils/logger"
import { publishLog } from "../utils/utils"

const execAsync = promisify(exec)
const __dirname = dirname(fileURLToPath(import.meta.url))

const CONTAINER_BOOT_WAIT_MS = 5000

export type DeploymentProcessResult = {
  success: boolean
  containerId?: string
  imageName?: string
  buildLogs: string
  port?: number
  error?: string
  outputPath?: string
}

export async function buildAndProcessDeployment(
  repoPath: string,
  port: number,
  deploymentId: string,
  timeoutMs = 600_000
): Promise<DeploymentProcessResult> {
  let buildLogs = ""

  const log = (msg: string) => {
    buildLogs += msg
    publishLog(deploymentId, msg)
  }

  const safeId = deploymentId.toLowerCase().replace(/[^a-z0-9_.-]/g, "")
  const imageName = `launchdrop-img-${safeId}`
  const containerName = `launchdrop-app-${safeId}`

  try {
    /* ---------- Step 1: Detect Build Tools ---------- */
    const buildTools = detectBuildTools(repoPath)
    logger.info({ buildTools }, `Detected build tools for ${deploymentId}`)

    /* ---------- Step 2: Prepare Dockerfile ---------- */
    const dockerDir = resolveDockerDir()

    const templateKey = buildTools.projectType === "nextjs" ? "nextjs" : "vite"
    const dockerfilePath = join(
      dockerDir,
      templateKey,
      `Dockerfile.${buildTools.packageManager}`
    )
    const dockerignorePath = join(dockerDir, ".dockerignore")

    if (!fs.existsSync(dockerfilePath)) {
      throw new Error(`Dockerfile template not found: ${dockerfilePath}`)
    }

    const dockerfile = await fs.promises.readFile(dockerfilePath, "utf-8")
    const dockerignore = fs.existsSync(dockerignorePath)
      ? await fs.promises.readFile(dockerignorePath, "utf-8")
      : ""

    await writeFile(join(repoPath, "Dockerfile"), dockerfile)
    if (dockerignore) {
      await writeFile(join(repoPath, ".dockerignore"), dockerignore)
    }

    log(`[SYSTEM] Dockerfile prepared (${buildTools.projectType})\n`)

    /* ---------- Step 3: Build Docker Image ---------- */
    logger.info(`Building image: ${imageName}`)

    await new Promise<void>((resolve, reject) => {
      const process = spawn("docker", ["build", "-t", imageName, repoPath], {
        timeout: timeoutMs,
      })

      process.stdout.on("data", (d) => log(d.toString()))
      process.stderr.on("data", (d) => log(d.toString()))

      process.on("close", (code) => {
        if (code === 0) resolve()
        else reject(new Error(`Docker build failed (code ${code})`))
      })

      process.on("error", reject)
    })

    logger.info(`Image built: ${imageName}`)

    /* ---------- Step 4: Handle Static Projects ---------- */
    if (buildTools.projectType !== "nextjs") {
      const outputDir = join(
        os.tmpdir(),
        "launchdrop-builds",
        deploymentId,
        "out"
      )

      await mkdir(outputDir, { recursive: true })

      const extractContainer = `launchdrop-extract-${safeId}`

      try {
        await execAsync(`docker create --name ${extractContainer} ${imageName}`)

        const srcPath = buildTools.outputDirectory
          ? `/app/${buildTools.outputDirectory}`
          : "/out"

        await execAsync(
          `docker cp ${extractContainer}:${srcPath}/. ${outputDir}/`
        )

        log("[SYSTEM] Static files extracted\n")

        return {
          success: true,
          imageName,
          buildLogs,
          outputPath: outputDir,
        }
      } catch (err: any) {
        return {
          success: false,
          imageName,
          buildLogs: buildLogs + `\n\nExtraction error: ${err.message}`,
          error: err.message,
        }
      } finally {
        await execAsync(`docker rm -f ${extractContainer}`).catch(() => { })
      }
    }

    /* ---------- Step 5: Run Container ---------- */
    let containerId: string

    try {
      const { stdout } = await execAsync(
        `docker run -d -e PORT=3000 -p ${port}:3000 ${imageName}`
      )

      containerId = stdout.trim()

      log(`[SYSTEM] Container started (${containerId.slice(0, 12)})\n`)
    } catch (err: any) {
      return {
        success: false,
        imageName,
        buildLogs,
        error: `Failed to start container: ${err.message}`,
      }
    }

    /* ---------- Step 6: Health Check ---------- */
    await new Promise((r) => setTimeout(r, CONTAINER_BOOT_WAIT_MS))

    const isReady = await waitForHttpReady(port)

    if (!isReady) {
      const { stdout: logs } = await execAsync(
        `docker logs ${containerId}`
      ).catch(() => ({ stdout: "No logs available" }))

      await execAsync(`docker rm -f ${containerId}`).catch(() => { })

      return {
        success: false,
        containerId,
        imageName,
        buildLogs: buildLogs + "\n\n" + logs,
        error: "Container failed health check",
      }
    }

    /* ---------- Success ---------- */
    return {
      success: true,
      containerId,
      imageName,
      buildLogs,
      port,
    }
  } catch (err: any) {
    logger.error({ err }, "Deployment failed")

    return {
      success: false,
      buildLogs,
      error: err.message,
    }
  }
}

/* ---------------- Helpers (kept minimal) ---------------- */

function resolveDockerDir(): string {
  let dir = __dirname

  while (true) {
    const candidate = join(dir, "infra/docker")
    if (fs.existsSync(candidate)) return candidate

    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  const fallback = join(process.cwd(), "infra/docker")
  if (fs.existsSync(fallback)) return fallback

  throw new Error("infra/docker directory not found")
}

async function waitForHttpReady(port: number): Promise<boolean> {
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`http://localhost:${port}`)
      if (res.ok) return true
    } catch { }

    await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}

