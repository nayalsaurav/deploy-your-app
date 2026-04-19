import path from "node:path"
import os from "node:os"
import { mkdtemp, rm } from "node:fs/promises"
import { spawn } from "node:child_process"
import { logger } from "../utils/logger"
import { publishLog } from "../utils/utils"

interface CloneRepoOptions {
  repo: string
  branch: string
  token: string
  deploymentId: string
}

interface CloneRepoResult {
  success: boolean
  message: string
  path: string
  logs: string
  cleanup: () => Promise<void>
}

export const cloneRepo = async ({
  repo,
  branch,
  token,
  deploymentId,
}: CloneRepoOptions): Promise<CloneRepoResult> => {
  let logs = ""

  const log = (chunk: string) => {
    logs += chunk
    publishLog(deploymentId, chunk)
  }
  const [owner, repoName] = repo.split("/")
  if (!owner || !repoName) {
    throw new Error(`Invalid repo format. Expected "owner/repo", got "${repo}"`)
  }

  const targetPath = await mkdtemp(path.join(os.tmpdir(), `${repoName}-`))

  logger.info({ repo, branch, targetPath }, "Starting git clone")

  return new Promise((resolve, reject) => {
    // --progress is required to see progress in non-tty environments
    const child = spawn("git", [
      "clone",
      "--depth", "1",
      "--branch", branch,
      "--progress",
      `https://github.com/${repo}.git`,
      targetPath
    ], {
      env: {
        ...process.env,
        GIT_ASKPASS: "echo",
        GIT_USERNAME: "x-token",
        GIT_PASSWORD: token,
      },
      timeout: 60_000,
    })

    child.stdout.on("data", (data) => {
      log(data.toString())
    })

    child.stderr.on("data", (data) => {
      log(data.toString())
    })

    child.on("close", async (code) => {
      if (code === 0) {
        resolve({
          success: true,
          message: "Repository cloned successfully",
          path: targetPath,
          logs,
          cleanup: () => rm(targetPath, { recursive: true, force: true }),
        })
      } else {
        await rm(targetPath, { recursive: true, force: true })
        resolve({
          success: false,
          message: `Git clone failed with exit code ${code}`,
          path: "",
          logs,
          cleanup: async () => { },
        })
      }
    })

    child.on("error", async (err) => {
      await rm(targetPath, { recursive: true, force: true })
      resolve({
        success: false,
        message: `Git clone error: ${err.message}`,
        path: "",
        logs,
        cleanup: async () => { },
      })
    })
  })
}
