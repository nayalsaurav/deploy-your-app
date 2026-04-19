import { redisPublisher } from "../config"
import { prisma } from "@workspace/database"

export const publishLog = async (deploymentId: string, message: string) => {
  try {
    await redisPublisher.publish(`logs:${deploymentId}`, message)
  } catch { }
}

export const updateDeployment = async (
  deploymentId: string,
  data: Record<string, any>
) => {
  return prisma.deployment.update({
    where: { id: deploymentId },
    data,
  })
}
