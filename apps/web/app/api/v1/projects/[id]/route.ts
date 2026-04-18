import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@workspace/database";
import { getSession } from "@/lib/auth-session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        deployments: {
          orderBy: {
            createdAt: "desc",
          },
        },
        envs: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "project not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { message: "Project fetched successfully", data: { project } },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership before deletion
    const project = await prisma.project.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    await prisma.project.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
