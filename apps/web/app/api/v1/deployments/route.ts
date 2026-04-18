import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@workspace/database";
import { getSession } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deployments = await prisma.deployment.findMany({
      where: {
        project: {
          userId: session.user.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        project: true,
      },
      take: 50, // Limit to recent 50
    });

    return NextResponse.json(
      { message: "Deployments fetched successfully", data: { deployments } },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch deployments" },
      { status: 500 }
    );
  }
}
