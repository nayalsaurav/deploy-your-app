import { prisma } from "@workspace/database";
import { getSession } from "./auth-session";

export async function getRepositories() {
    const session = await getSession();

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
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
        throw new Error("No GitHub access token found");
    }

    const response = await fetch(
        "https://api.github.com/user/repos?sort=updated&per_page=100&type=all",
        {
            headers: {
                Authorization: `Bearer ${account.accessToken}`,
                Accept: "application/vnd.github+json",
            },
        }
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`GitHub API error: ${err}`);
    }

    const repos = await response.json();

    return repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        htmlUrl: repo.html_url,
        updatedAt: repo.updated_at,
        language: repo.language,
        defaultBranch: repo.default_branch,
    }));
}