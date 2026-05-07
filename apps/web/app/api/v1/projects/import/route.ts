import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { prisma, encrypt } from "@workspace/database"
import { deploymentQueue } from "@workspace/queue"
import { createGithubWebhook } from "@/lib/github"

export const POST = async (req: NextRequest) => {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { repositoryFullName, defaultBranch, name, buildCommand, startCommand, rootDirectory, envs = [] } = body
    console.log("Received : ", { body })

    if (!repositoryFullName || !defaultBranch || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "github",
      },
      select: {
        accessToken: true,
      },
    })

    if (!account?.accessToken) {
      return NextResponse.json(
        { error: "No GitHub access token found" },
        { status: 401 }
      )
    }

    const [project, deployment] = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          name,
          repositoryFullName,
          defaultBranch,
          userId: session.user.id,
          buildCommand: buildCommand || null,
          startCommand: startCommand || null,
          rootDirectory: rootDirectory || null,
          envs: {
            create: envs.map((e: { key: string, value: string }) => {
              const encryptionKey = process.env.MASTER_ENCRYPTION_KEY
              const encryptedValue = encryptionKey ? encrypt(e.value, encryptionKey) : e.value
              return {
                key: e.key,
                value: encryptedValue
              }
            })
          }
        },
      })

      const newDeployment = await tx.deployment.create({
        data: {
          projectId: newProject.id,
          branch: defaultBranch,
        },
      })

      return [newProject, newDeployment]
    })

    const [owner, repoName] = repositoryFullName.split("/")

    // Auto-create Webhook in GitHub to listen for push events
    await createGithubWebhook(account.accessToken, owner, repoName, project.id)

    await deploymentQueue.add("deployment-event", {
      token: account.accessToken,
      repo: repositoryFullName,
      branch: defaultBranch,
      owner,
      repoName,
      projectId: project.id,
      deploymentId: deployment.id,
      // Pass the config settings for the initial build
      rootDirectory: project.rootDirectory,
      buildCommand: project.buildCommand,
      startCommand: project.startCommand,
      envs: envs.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value
        return acc
      }, {}),
      prNumber: 0,
      commentId: null,
      installationId: null,
    })
    return NextResponse.json({ project, deployment })
  } catch (error: any) {
    console.error("Error importing project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
