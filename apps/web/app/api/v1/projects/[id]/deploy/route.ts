import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { prisma } from "@workspace/database"
import { deploymentQueue } from "@workspace/queue"

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const project = await prisma.project.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 404 }
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

    // Create a new deployment record
    const deployment = await prisma.deployment.create({
      data: {
        projectId: project.id,
        branch: project.defaultBranch,
        status: "PENDING",
      },
    })

    const [owner, repoName] = project.repositoryFullName.split("/")

    // Add event to queue
    await deploymentQueue.add("clone-repository", {
      token: account.accessToken,
      repo: project.repositoryFullName,
      branch: project.defaultBranch,
      owner,
      repoName,
      projectId: project.id,
      deploymentId: deployment.id,
      prNumber: 0,
      commentId: null,
      installationId: null,
    })

    return NextResponse.json(
      { message: "Deployment queued successfully", data: { deployment } },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error queueing deployment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
