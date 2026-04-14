import path from "node:path"
import os from "node:os"
import { mkdtemp, rm } from "node:fs/promises"
import { exec } from "../utils/exec"

interface CloneRepoOptions {
  repo: string
  branch: string
  token: string
}

interface CloneRepoResult {
  success: boolean
  message: string
  path: string
  cleanup: () => Promise<void>
}

export const cloneRepo = async ({
  repo,
  branch,
  token,
}: CloneRepoOptions): Promise<CloneRepoResult> => {
  const [owner, repoName] = repo.split("/")
  if (!owner || !repoName) {
    throw new Error(`Invalid repo format. Expected "owner/repo", got "${repo}"`)
  }

  const targetPath = await mkdtemp(path.join(os.tmpdir(), `${repoName}-`))

  const command = `git clone --depth 1 --branch ${branch} https://github.com/${repo}.git ${targetPath}`

  try {
    await exec(command, {
      env: {
        ...process.env,
        GIT_ASKPASS: "echo",
        GIT_USERNAME: "x-token",
        GIT_PASSWORD: token,
      },
    })
  } catch (err) {
    await rm(targetPath, { recursive: true, force: true })
    throw new Error(
      `Failed to clone ${repo}@${branch}: ${(err as Error).message}`
    )
  }

  return {
    success: true,
    message: "Repository cloned successfully",
    path: targetPath,
    cleanup: () => rm(targetPath, { recursive: true, force: true }),
  }
}
