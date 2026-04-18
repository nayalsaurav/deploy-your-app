import { exec, spawn } from "node:child_process"
import { promisify } from "node:util"
import { writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"
import os from "node:os"
import fs from "node:fs"
import { detectBuildTools } from "../utils/detect"
import { logger } from "../utils/logger"

const execAsync = promisify(exec)
const __dirname = dirname(fileURLToPath(import.meta.url))

const CONTAINER_BOOT_WAIT_MS = 5_000

export type DeploymentProcessResult = {
  success: boolean
  containerId?: string
  imageName?: string
  buildLogs: string
  port?: number
  error?: string
  outputPath?: string
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

  const cwdCandidate = join(process.cwd(), "infra/docker")
  if (fs.existsSync(cwdCandidate)) return cwdCandidate

  throw new Error(
    "Could not locate infra/docker directory. " +
    "Ensure the project root contains an infra/docker folder."
  )
}

async function getDockerFiles(
  projectType: string,
  packageManager: string
): Promise<{ dockerfile: string; dockerignore: string }> {
  const templateKey = projectType === "nextjs" ? "nextjs" : "vite"
  const dockerDir = resolveDockerDir()

  const dockerfilePath = join(dockerDir, templateKey, `Dockerfile.${packageManager}`)
  const dockerignorePath = join(dockerDir, ".dockerignore")

  if (!fs.existsSync(dockerfilePath)) {
    throw new Error(`Dockerfile template not found: ${dockerfilePath}`)
  }

  const [dockerfile, dockerignore] = await Promise.all([
    fs.promises.readFile(dockerfilePath, "utf-8"),
    fs.existsSync(dockerignorePath)
      ? fs.promises.readFile(dockerignorePath, "utf-8")
      : Promise.resolve(""),
  ])

  return { dockerfile, dockerignore }
}

export async function buildAndProcessDeployment(
  repoPath: string,
  targetPort: number,
  deploymentId: string,
  timeoutMs = 600_000,
  onLog?: (log: string) => void
): Promise<DeploymentProcessResult> {
  // Detect project type and package manager
  const buildTools = detectBuildTools(repoPath)
  logger.info({ buildTools }, `Detected tools for deployment ${deploymentId}`)

  // Write Dockerfile (and optional .dockerignore) into the repo
  const { dockerfile, dockerignore } = await getDockerFiles(
    buildTools.projectType,
    buildTools.packageManager
  )
  await writeFile(join(repoPath, "Dockerfile"), dockerfile)
  if (dockerignore) {
    await writeFile(join(repoPath, ".dockerignore"), dockerignore)
  }
  logger.info(`Wrote Dockerfile for ${buildTools.projectType} project (${buildTools.packageManager})`)
  onLog?.(`[SYSTEM] Prepared Dockerfile for ${buildTools.projectType} (${buildTools.packageManager})\n`)

  // Unique names for this deployment
  const safeId = deploymentId.toLowerCase().replace(/[^a-z0-9_.-]/g, "")
  const imageName = `launchdrop-img-${safeId}`
  const containerName = `launchdrop-app-${safeId}`

  logger.info(`Building Docker image: ${imageName}`)
  let buildLogs: string = ""
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn("docker", ["build", "-t", imageName, repoPath], {
        timeout: timeoutMs,
      })

      child.stdout.on("data", (data: Buffer) => {
        const text = data.toString()
        buildLogs += text
        onLog?.(text)
      })

      child.stderr.on("data", (data: Buffer) => {
        const text = data.toString()
        buildLogs += text
        onLog?.(text)
      })

      child.on("close", (code) => {
        if (code === 0) resolve()
        else reject(new Error(`Docker build process exited with code ${code}`))
      })

      child.on("error", (err) => {
        reject(err)
      })
    })
    logger.info(`Docker build succeeded: ${imageName}`)
  } catch (err: any) {
    logger.error({ error: err.message }, `Docker build failed: ${imageName}`)
    return { success: false, buildLogs, error: `Build failed: ${err.message}` }
  }

  if (buildTools.projectType !== "nextjs") {
    const outputPath = join(os.tmpdir(), "launchdrop-builds", deploymentId, "out")
    await mkdir(outputPath, { recursive: true })

    const extractContainer = `launchdrop-extract-${safeId}`
    try {
      await execAsync(`docker create --name ${extractContainer} ${imageName} true`)

      const srcPath = buildTools.outputDirectory
        ? `/app/${buildTools.outputDirectory}`
        : "/out"

      await execAsync(`docker cp ${extractContainer}:${srcPath}/. ${outputPath}/`)
      logger.info(`Static files extracted to ${outputPath}`)
      onLog?.(`[SYSTEM] Static site payload extracted securely.\n`)

      return { success: true, imageName, buildLogs, outputPath }
    } catch (err: any) {
      logger.error({ error: err.message }, `Failed to extract static files from ${imageName}`)
      return {
        success: false,
        imageName,
        buildLogs: `${buildLogs}\n\nExtraction error: ${err.message}`,
        error: `Extraction failed: ${err.message}`,
      }
    } finally {
      await execAsync(`docker rm -f ${extractContainer}`).catch(() => { })
    }
  }

  logger.info(`Starting container ${containerName} on port ${targetPort}`)
  let containerId: string
  try {
    const { stdout } = await execAsync(
      `docker run -d \
  -e PORT=3000 \
  -p ${targetPort}:3000 \
  ${imageName}`
    )
    containerId = stdout.trim()
    logger.info(`Container started: ${containerId.slice(0, 12)} → port ${targetPort}`)
    onLog?.(`[SYSTEM] Container ${containerId.slice(0, 12)} launched on internal port ${targetPort}\n`)
  } catch (err: any) {
    logger.error({ error: err.message }, `Failed to start container for ${imageName}`)
    return { success: false, imageName, buildLogs, error: `Failed to start container: ${err.message}` }
  }

  await new Promise((resolve) => setTimeout(resolve, CONTAINER_BOOT_WAIT_MS))

  const isRunning = await waitForHttpReady(targetPort)
  if (!isRunning) {
    const { stdout: containerLogs } = await execAsync(`docker logs ${containerId}`).catch(
      () => ({ stdout: "Could not fetch container logs" })
    )
    await execAsync(`docker rm -f ${containerId}`).catch(() => { })
    return {
      success: false,
      containerId,
      imageName,
      buildLogs: `${buildLogs}\n\n=== Container Logs ===\n${containerLogs}`,
      error: "Container exited unexpectedly after startup",
    }
  }

  return { success: true, containerId, imageName, buildLogs, port: targetPort }
}

export async function stopAndRemoveContainer(containerId: string): Promise<void> {
  logger.info(`Stopping container ${containerId.slice(0, 12)}`)
  try {
    await execAsync(`docker stop ${containerId}`)
    await execAsync(`docker rm ${containerId}`)
    logger.info(`Container removed: ${containerId.slice(0, 12)}`)
  } catch (err: any) {
    logger.error({ error: err.message }, `Failed to stop/remove container ${containerId.slice(0, 12)}`)
  }
}

export async function removeDockerImage(imageName: string): Promise<void> {
  logger.info(`Removing image ${imageName}`)
  try {
    await execAsync(`docker rmi ${imageName}`)
    logger.info(`Image removed: ${imageName}`)
  } catch (err: any) {
    logger.error({ error: err.message }, `Failed to remove image ${imageName}`)
  }
}

export async function getContainerLogs(containerId: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(`docker logs ${containerId} --tail 100`)
    return stdout + stderr
  } catch (err: any) {
    return (err.stdout ?? "") + (err.stderr ?? "")
  }
}



async function waitForHttpReady(port: number): Promise<boolean> {
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`http://localhost:${port}`)
      if (res.ok) return true
    } catch { }

    await new Promise(r => setTimeout(r, 1000))
  }
  return false
}

export async function cleanupTempBuilds(deploymentId: string): Promise<void> {
  const buildDir = join(os.tmpdir(), "launchdrop-builds", deploymentId)
  try {
    await fs.promises.rm(buildDir, { recursive: true, force: true })
    logger.info(`Cleaned up temp build directory: ${buildDir}`)
  } catch (err) {
    // Ignore if not present
  }
}