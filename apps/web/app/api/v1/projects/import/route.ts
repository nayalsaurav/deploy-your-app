import { NextRequest, NextResponse } from "next/server";
import { queue } from "@/lib/queue";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@workspace/database";

export const POST = async (req: NextRequest) => {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { repositoryFullName, defaultBranch, name } = body;

        if (!repositoryFullName || !defaultBranch || !name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const account = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                providerId: "github",
            },
            select: {
                accessToken: true,
            }
        });

        if (!account?.accessToken) {
            return NextResponse.json({ error: "No GitHub access token found" }, { status: 401 });
        }

        const [project, deployment] = await prisma.$transaction(async (tx) => {
            const newProject = await tx.project.create({
                data: {
                    name,
                    repositoryFullName,
                    defaultBranch,
                    userId: session.user.id,
                },
            });

            const newDeployment = await tx.deployment.create({
                data: {
                    projectId: newProject.id,
                    branch: defaultBranch,
                },
            });

            return [newProject, newDeployment];
        });

        const [owner, repoName] = repositoryFullName.split("/");
        // await queue.add("clone-repository", {
        //     token: account.accessToken,
        //     repo: repositoryFullName,
        //     branch: defaultBranch,
        //     owner,
        //     repoName,
        //     projectId: project.id,
        //     deploymentId: deployment.id,
        //     // For initial import, we don't have PR-specific data
        //     prNumber: 0,
        //     commentId: null,
        //     installationId: null,
        // });
        return NextResponse.json({ project, deployment });
    } catch (error: any) {
        console.error("Error importing project:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}