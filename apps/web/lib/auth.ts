import { betterAuth, type BetterAuthOptions } from "better-auth"
import { prisma } from "@workspace/database"
import { prismaAdapter } from "@better-auth/prisma-adapter"

const authOptions = {
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scope: ["read:user", "user:email", "repo"],
    },
  },
  experimental: {
    joins: true,
  },
} satisfies BetterAuthOptions
export const auth = betterAuth<typeof authOptions>(authOptions)
export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user
