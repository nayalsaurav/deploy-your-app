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
  timeoutMs = 600_000,
  config?: {
    buildCommand?: string | null
    startCommand?: string | null
    rootDirectory?: string | null
    envs?: Record<string, string>
  }
): Promise<DeploymentProcessResult> {
  let buildLogs = ""

  const log = (msg: string) => {
    const masked = maskSecrets(msg, config?.envs)
    buildLogs += masked
    publishLog(deploymentId, masked)
  }

  const safeId = deploymentId.toLowerCase().replace(/[^a-z0-9_.-]/g, "")
  const imageName = `launchdrop-img-${safeId}`
  const containerName = `launchdrop-app-${safeId}`

  try {
    /* ---------- Step 1: Detect Build Tools ---------- */
    const normalizedRootDir = config?.rootDirectory?.replace(/^(\.\/|\/)/, "").replace(/\/$/, "")
    const targetDir = normalizedRootDir ? join(repoPath, normalizedRootDir) : repoPath
    logger.info({ repoPath, normalizedRootDir, targetDir }, "Resolved build directory")

    if (!fs.existsSync(join(targetDir, "package.json"))) {
      const files = fs.existsSync(targetDir) ? fs.readdirSync(targetDir) : ["DIRECTORY_NOT_FOUND"]
      const debugMsg = `[DEBUG] Files in ${targetDir}: ${files.join(", ")}`
      console.log(debugMsg)
      await publishLog(deploymentId, `${debugMsg}\n`)
      throw new Error(`CRITICAL: package.json missing at ${targetDir}. Found files: ${files.join(", ")}`)
    }

    const buildTools = detectBuildTools(targetDir)
    logger.info({ buildTools, isTypescript: buildTools.isTypescript }, `Detected build tools for ${deploymentId} in ${targetDir}`)

    // Debug: Log package.json to verify scripts
    try {
      const pkg = JSON.parse(fs.readFileSync(join(targetDir, "package.json"), "utf-8"))
      logger.info({ scripts: pkg.scripts }, "Project scripts")
    } catch (e) { }

    /* ---------- Step 2: Prepare Dockerfile ---------- */
    const dockerDir = resolveDockerDir()

    const templateKey =
      buildTools.projectType === "nextjs" ? "nextjs" :
        buildTools.projectType === "nodejs" ? "nodejs" : "vite"
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

    await writeFile(join(targetDir, "Dockerfile"), dockerfile)

    // Always write .env to the target directory so it's available where the build runs
    if (config?.envs && Object.keys(config.envs).length > 0) {
      const envContent = Object.entries(config.envs)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n")
      await writeFile(join(targetDir, ".env"), envContent)
      log(`[SYSTEM] Environment variables injected into ${config.rootDirectory || "root"}\n`)
    }

    if (dockerignore) {
      // Ensure .env is NOT ignored. We write this to repoPath because that's our context root.
      const updatedIgnore = dockerignore + "\n!.env\n"
      await writeFile(join(repoPath, ".dockerignore"), updatedIgnore)
    }

    log(`[SYSTEM] Dockerfile prepared (${buildTools.projectType})\n`)

    /* ---------- Step 3: Build Docker Image ---------- */
    logger.info(`Building image: ${imageName}`)

    await new Promise<void>((resolve, reject) => {
      const buildArgs = []
      if (config?.buildCommand) {
        buildArgs.push("--build-arg", `BUILD_COMMAND=${config.buildCommand}`)
      }
      const startCmd = config?.startCommand || buildTools.suggestedStartCommand
      if (startCmd) {
        buildArgs.push("--build-arg", `START_COMMAND=${startCmd}`)
      }
      if (normalizedRootDir) {
        buildArgs.push("--build-arg", `ROOT_DIR=${normalizedRootDir}`)
      }

      // Context is repoPath, but Dockerfile is in targetDir
      const process = spawn("docker", [
        "build",
        "-t", imageName,
        "-f", join(targetDir, "Dockerfile"),
        ...buildArgs,
        repoPath
      ], {
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
    if (buildTools.projectType !== "nextjs" && buildTools.projectType !== "nodejs") {
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

        const relRoot = config?.rootDirectory ? `${config.rootDirectory}/` : ""
        const srcPath = buildTools.outputDirectory
          ? `/app/${relRoot}${buildTools.outputDirectory}`
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
      const envFlags = config?.envs
        ? Object.entries(config.envs).flatMap(([k, v]) => ["-e", `${k}=${v}`])
        : []

      // Determine target port (default to 3000, but use PORT from envs if provided)
      const targetPort = config?.envs?.PORT || "3000"

      const runArgs = [
        "run",
        "-d",
        "-e",
        `PORT=${targetPort}`,
        "-p",
        `${port}:${targetPort}`,
        ...envFlags,
        imageName,
      ]

      const { stdout, stderr } = await new Promise<{
        stdout: string
        stderr: string
      }>((resolve, reject) => {
        const p = spawn("docker", runArgs)
        let out = ""
        let err = ""
        p.stdout.on("data", (d) => (out += d.toString()))
        p.stderr.on("data", (d) => (err += d.toString()))
        p.on("close", (code) => {
          if (code === 0) resolve({ stdout: out, stderr: err })
          else reject(new Error(`docker run failed (code ${code}): ${err}`))
        })
        p.on("error", reject)
      })

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
      // Capture both stdout and stderr
      const { stdout: logs } = await execAsync(
        `docker logs ${containerId} 2>&1`
      ).catch(() => ({ stdout: "No logs available" }))

      const { stdout: status } = await execAsync(
        `docker inspect --format "{{.State.Status}} (ExitCode: {{.State.ExitCode}})" ${containerId}`
      ).catch(() => ({ stdout: "Unknown" }))

      console.error(`[SYSTEM] Container ${containerId} Status: ${status.trim()}`)
      console.error(`[SYSTEM] Container logs (combined stdout/stderr):\n${logs}`)

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

function maskSecrets(text: string, envs?: Record<string, string>): string {
  if (!envs) return text
  let masked = text
  Object.values(envs).forEach((value) => {
    if (value && value.length > 3) {
      // Escape special regex characters in value
      const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const regex = new RegExp(escaped, "g")
      masked = masked.replace(regex, "[REDACTED]")
    }
  })
  return masked
}

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
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}`)

      if (res.status > 0) return true
    } catch (e) {
    }

    await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}

