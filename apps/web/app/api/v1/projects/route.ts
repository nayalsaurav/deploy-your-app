import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@workspace/database";
import { getSession } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
      },
    });
    return NextResponse.json(
      { message: "Projects fetched successfully", data: { projects } },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "failed to fetch projects" },
      { status: 500 }
    );
  }
}
