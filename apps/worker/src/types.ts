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
  buildCommand: z.string().nullish(),
  startCommand: z.string().nullish(),
  rootDirectory: z.string().nullish(),
  envs: z.record(z.string(), z.string()).optional(),
})

export type Payload = z.infer<typeof payloadSchema>
