import express from "express"
import crypto from "crypto"
import { prisma, decrypt } from "@workspace/database"
import { deploymentQueue } from "@workspace/queue"

const app = express()
const port = process.env.PORT || 4000

app.use(
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf
    },
  })
)

const GITHUB_WEBHOOK_SECRET =
  process.env.GITHUB_WEBHOOK_SECRET || "development-secret"

function verifyGitHubSignature(
  req: any,
  res: express.Response,
  next: express.NextFunction
) {
  const signature = req.headers["x-hub-signature-256"]

  if (!signature || !req.rawBody) {
    return res.status(401).send("No signature or body provided")
  }

  const hmac = crypto.createHmac("sha256", GITHUB_WEBHOOK_SECRET)
  const digest = "sha256=" + hmac.update(req.rawBody).digest("hex")

  if (signature !== digest) {
    return res.status(401).send("Invalid signature")
  }

  next()
}

app.post("/webhook/:projectId", verifyGitHubSignature, async (req, res) => {
  try {
    const { projectId } = req.params
    const event = req.headers["x-github-event"]

    // We only care about push events
    if (event !== "push") {
      return res.status(200).send("Event ignored, not a push event.")
    }

    const payload = req.body

    // Default to main branch if not specified (we can parse refs/heads/branch)
    const branch = payload.ref ? payload.ref.replace("refs/heads/", "") : "main"
    const commitHash = payload.after // Head commit on push

    if (!commitHash) {
      return res.status(400).send("No commit hash found in payload")
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { envs: true },
    })

    if (!project) {
      return res.status(404).send("Project not found")
    }

    const envs: Record<string, string> = {}
    const encryptionKey = process.env.MASTER_ENCRYPTION_KEY

    if (project.envs) {
      project.envs.forEach((e) => {
        try {
          // Attempt decryption if key is present, otherwise fallback to raw value
          envs[e.key] = encryptionKey ? decrypt(e.value, encryptionKey) : e.value
        } catch (error) {
          envs[e.key] = e.value
        }
      })
    }

    const account = await prisma.account.findFirst({
      where: { userId: project.userId, providerId: "github" },
    })

    if (!account || !account.accessToken) {
      return res
        .status(400)
        .send("No GitHub account or token found for this user")
    }

    const [owner, repoName] = project.repositoryFullName.split("/")

    // Create a pending deployment
    const deployment = await prisma.deployment.create({
      data: {
        projectId: project.id,
        branch,
        commitHash,
        status: "PENDING",
      },
    })

    // Schedule the deployment in the BullMQ queue
    await deploymentQueue.add("deployment-event", {
      token: account.accessToken,
      repo: project.repositoryFullName,
      branch: branch,
      owner,
      repoName,
      projectId: project.id,
      deploymentId: deployment.id,
      prNumber: 0,
      commentId: null,
      installationId: null,
      buildCommand: project.buildCommand,
      startCommand: project.startCommand,
      rootDirectory: project.rootDirectory,
      envs,
    })

    console.log(
      `[Deploy Webhook] Enqueued deployment ${deployment.id} for project ${project.id} (commit: ${commitHash})`
    )

    return res.status(200).json({
      message: "Deployment scheduled",
      deploymentId: deployment.id,
    })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return res.status(500).send("Internal server error")
  }
})

app.listen(port, () => {
  console.log(`API server running on port ${port}...`)
})
