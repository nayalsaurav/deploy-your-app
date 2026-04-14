import { prisma } from "@workspace/database"
import { getSession } from "./auth-session"
import { GithubRepository } from "./types"

export async function getRepositories(
  page = 1,
  perPage = 10
): Promise<{ repos: GithubRepository[]; hasMore: boolean }> {
  const session = await getSession()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
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
    throw new Error("No GitHub access token found")
  }

  const response = await fetch(
    `https://api.github.com/user/repos?sort=updated&per_page=${perPage}&page=${page}&type=all`,
    {
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        Accept: "application/vnd.github+json",
      },
      next: { revalidate: 300 },
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`GitHub API error: ${err}`)
  }

  const reposData = await response.json()

  // Check if there are more pages based on the Link header
  const linkHeader = response.headers.get("link")
  const hasMore = linkHeader ? linkHeader.includes(`rel="next"`) : false

  const formattedRepos = reposData.map((repo: any) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    private: repo.private,
    htmlUrl: repo.html_url,
    updatedAt: repo.updated_at,
    language: repo.language,
    defaultBranch: repo.default_branch,
  }))

  return {
    repos: formattedRepos,
    hasMore,
  }
}
