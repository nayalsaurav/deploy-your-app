export interface GithubRepository {
  id: number
  name: string
  fullName: string
  description: string | null
  private: boolean
  htmlUrl: string
  updatedAt: string | null
  language: string | null
  defaultBranch: string
}
