import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string(),
  repoUrl: z.url(),
  branch: z.string().default("main"),
  buildCommand: z.string().optional(),
  rootDirectory: z.string().optional(),
  metadata: z.any().optional(),
  envs: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  ).optional(),
});

export const createDeploymentSchema = z.object({
  projectId: z.string(),
  status: z.enum(["QUEUED", "BUILDING", "SUCCESS", "FAILED"]),
  url: z.url().optional(),
  port: z.number().optional(),
  logs: z.string().optional(),
});


export const createEnvSchema = z.object({
  key: z.string(),
  value: z.string(),
  projectId: z.string(),
});