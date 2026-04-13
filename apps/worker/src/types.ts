import { z } from "zod"

export const payloadSchema = z.object({
  token: z.string(),
  repo: z.string(),
  branch: z.string(),
  owner: z.string(),
  repoName: z.string(),
  projectId: z.string(),
  deploymentId: z.string(),
  prNumber: z.number().optional(),
  commentId: z.union([z.string(), z.number()]).nullish(),
  installationId: z.union([z.string(), z.number()]).nullish(),
})

export type Payload = z.infer<typeof payloadSchema>
