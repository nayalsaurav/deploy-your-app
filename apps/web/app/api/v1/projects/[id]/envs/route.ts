import { NextResponse, NextRequest } from "next/server"
import { prisma, encrypt } from "@workspace/database"
import { getSession } from "@/lib/auth-session"

/**
 * Add or Update an environment variable
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = await params
    const { key, value } = await req.json()

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 })
    }

    // Check ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId, userId: session.user.id },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const encryptionKey = process.env.MASTER_ENCRYPTION_KEY
    if (!encryptionKey) {
      console.error("MASTER_ENCRYPTION_KEY is not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const encryptedValue = encrypt(value, encryptionKey)

    // Upsert the environment variable
    const existingEnv = await prisma.env.findFirst({
      where: { projectId, key },
    })

    if (existingEnv) {
      await prisma.env.update({
        where: { id: existingEnv.id },
        data: { value: encryptedValue },
      })
    } else {
      await prisma.env.create({
        data: {
          projectId,
          key,
          value: encryptedValue,
        },
      })
    }

    return NextResponse.json({ message: "Environment variable saved" }, { status: 200 })
  } catch (error) {
    console.error("Failed to save env:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Delete an environment variable
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = await params
    const { searchParams } = new URL(req.url)
    const envId = searchParams.get("envId")

    if (!envId) {
      return NextResponse.json({ error: "envId is required" }, { status: 400 })
    }

    // Check ownership of project and existence of env
    const env = await prisma.env.findFirst({
      where: {
        id: envId,
        projectId: projectId,
        project: { userId: session.user.id },
      },
    })

    if (!env) {
      return NextResponse.json({ error: "Environment variable not found" }, { status: 404 })
    }

    await prisma.env.delete({
      where: { id: envId },
    })

    return NextResponse.json({ message: "Environment variable deleted" }, { status: 200 })
  } catch (error) {
    console.error("Failed to delete env:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
