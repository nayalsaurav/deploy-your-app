import { prisma } from "@workspace/database"
import { getSession } from "./auth-session"
import { GithubRepository } from "./types"

import { Octokit } from "@octokit/rest"
import { RequestError } from "@octokit/request-error"

const getOctokit = (token: string) => new Octokit({ auth: token })

export async function createGithubWebhook(
  accessToken: string,
  owner: string,
  repo: string,
  projectId: string
) {
  const octokit = getOctokit(accessToken)

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL}/webhook/${projectId}`
  const secret = process.env.GITHUB_WEBHOOK_SECRET || "development-secret"

  try {
    await octokit.repos.createWebhook({
      owner,
      repo,
      name: "web",
      active: true,
      events: ["push"],
      config: {
        url: webhookUrl,
        content_type: "json",
        secret: secret,
        insecure_ssl: "0",
      },
    })

    console.log(`Webhook created successfully for ${owner}/${repo}`)
  } catch (error) {
    if (error instanceof RequestError) {
      if (
        error.status === 422 &&
        error.message.includes("Hook already exists")
      ) {
        console.warn(`Webhook already exists for ${owner}/${repo}. Skipping.`)
        return
      }

      console.error(`GitHub API Error (${error.status}): ${error.message}`)
    } else {
      console.error("Unexpected error creating webhook:", error)
    }
  }
}

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

  const octokit = getOctokit(account.accessToken)

  try {
    const response = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: perPage,
      page: page,
      type: "all",
      headers: {
        "x-next-revalidate": "300",
      },
    })

    const reposData = response.data
    const linkHeader = response.headers.link
    const hasMore = !!linkHeader && linkHeader.includes('rel="next"')

    const formattedRepos: GithubRepository[] = reposData.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      htmlUrl: repo.html_url,
      updatedAt: repo.updated_at ?? null,
      language: repo.language ?? null,
      defaultBranch: repo.default_branch,
    }))

    return {
      repos: formattedRepos,
      hasMore,
    }
  } catch (error) {
    if (error instanceof RequestError) {
      throw new Error(`GitHub API error [${error.status}]: ${error.message}`)
    }
    throw error
  }
}
