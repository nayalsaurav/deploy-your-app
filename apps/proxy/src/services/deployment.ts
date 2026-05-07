import { prisma } from "@workspace/database"
import { BASE_DOMAIN } from "../env"
import { ResolvedDeployment } from "../types"

function extractSubdomain(hostname: string): string | null {
  if (!hostname.endsWith(`.${BASE_DOMAIN}`)) return null
  const subdomain = hostname.slice(0, -`.${BASE_DOMAIN}`.length)
  if (!subdomain || subdomain.includes(".")) return null
  return subdomain
}

export async function resolveDeployment(
  hostname: string
): Promise<ResolvedDeployment | null> {
  const subdomain = extractSubdomain(hostname)
  if (!subdomain) return null

  console.log(`[proxy] resolving subdomain: "${subdomain}"`)

  const deployment = await prisma.deployment.findFirst({
    where: {
      OR: [
        { id: subdomain },
        { url: { startsWith: subdomain } },
        { project: { deploymentUrl: { startsWith: subdomain } } },
      ],
      status: "SUCCESS",
    },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      port: true,
      project: { select: { id: true } },
    },
  })

  if (!deployment) {
    console.log(`[proxy] no deployment found for subdomain "${subdomain}"`)
    return null
  }

  console.log(`[proxy] resolved deployment:`, {
    id: deployment.id,
    port: deployment.port,
  })

  return {
    id: deployment.id,
    port: deployment.port,
    projectId: deployment.project.id,
  }
}
