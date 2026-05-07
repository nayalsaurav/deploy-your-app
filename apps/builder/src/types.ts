import { z } from "zod"

const SAFE_SLUG = /^[a-zA-Z0-9._\-]+$/
const SAFE_REPO = /^[a-zA-Z0-9._\-]+\/[a-zA-Z0-9._\-]+$/

export const payloadSchema = z
  .object({
    token: z.string().min(1, "Token is required").trim(),
    repo: z.string().regex(SAFE_REPO, 'Must be in "owner/repo" format'),
    branch: z.string().regex(SAFE_SLUG, "Invalid branch name"),
    owner: z.string().regex(SAFE_SLUG, "Invalid owner name"),
    repoName: z.string().regex(SAFE_SLUG, "Invalid repo name"),
    projectId: z.string(),
    deploymentId: z.string(),
    prNumber: z.number().int().nonnegative().optional(),
    commentId: z.coerce.string().nullish(),
    installationId: z.coerce.string().nullish(),
    buildCommand: z.string().nullish(),
    startCommand: z.string().nullish(),
    rootDirectory: z.string().nullish(),
    envs: z.record(z.string(), z.string()).optional(),
  })
  .strict()

export type Payload = z.infer<typeof payloadSchema>
