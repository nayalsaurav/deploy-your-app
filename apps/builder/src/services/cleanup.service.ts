import { rm } from "node:fs/promises"
import { join } from "node:path"
import os from "node:os"
import { exec } from "node:child_process"
import { promisify } from "node:util"
import { logger } from "../utils/logger"

const execAsync = promisify(exec)

export interface CleanupOptions {
    deploymentId: string
    repoPath?: string
    imageName?: string
    containerId?: string
    forceRemoveImage?: boolean
}

export async function cleanupRepo(repoPath: string) {
    try {
        if (repoPath) {
            await rm(repoPath, { recursive: true, force: true })
            logger.info({ repoPath }, "Repository cleaned up")
        }
    } catch (error) {
        logger.error({ error, repoPath }, "Failed to cleanup repository")
    }
}

export async function cleanupBuildFolder(deploymentId: string) {
    const dir = join(os.tmpdir(), "launchdrop-builds", deploymentId)
    try {
        await rm(dir, { recursive: true, force: true })
        logger.info({ dir, deploymentId }, "Temp build folder cleaned up")
    } catch (error) {
        logger.debug({ error, dir }, "Failed to cleanup build folder (likely already gone)")
    }
}

export async function cleanupDockerResources(containerId?: string, imageName?: string) {
    if (containerId) {
        try {
            await execAsync(`docker rm -f ${containerId}`)
            logger.info({ containerId }, "Docker container removed")
        } catch (error) {
            logger.error({ error, containerId }, "Failed to remove Docker container")
        }
    }

    if (imageName) {
        try {
            await execAsync(`docker rmi -f ${imageName}`)
            logger.info({ imageName }, "Docker image removed")
        } catch (error) {
            logger.error({ error, imageName }, "Failed to remove Docker image")
        }
    }
}

export async function performFullCleanup({
    deploymentId,
    repoPath,
    imageName,
    containerId,
    forceRemoveImage = false,
}: CleanupOptions) {
    logger.info({ deploymentId }, "Starting full cleanup")
    if (repoPath) await cleanupRepo(repoPath)
    await cleanupBuildFolder(deploymentId)
    if (forceRemoveImage) {
        await cleanupDockerResources(containerId, imageName)
    }

    logger.info({ deploymentId }, "Full cleanup completed")
}
