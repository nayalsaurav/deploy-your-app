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

    const deployment = await prisma.deployment.findUnique({
      where: {
        id: id,
        project: {
          userId: session.user.id,
        },
      },
      include: {
        project: true
      }
    });

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Deployment fetched successfully", data: { deployment } },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch deployment" },
      { status: 500 }
    );
  }
}
