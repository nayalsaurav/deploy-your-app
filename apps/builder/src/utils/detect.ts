import fs from "fs"
import path, { join } from "path"
import { logger } from "./logger"

export type ProjectType = "nextjs" | "vite" | "cra" | "nodejs" | "unknown"

export interface BuildTools {
  packageManager: "npm" | "yarn" | "pnpm" | "bun"
  installCommand: string
  buildCommand: string
  suggestedStartCommand?: string
  projectType: ProjectType
  outputDirectory: string
  isTypescript: boolean
}

const MAX_PACKAGE_JSON_SIZE = 1024 * 1024 // 1MB

export function detectProjectType(repoPath: string): {
  type: ProjectType
  outDir: string
  isTypescript: boolean
  suggestedStartCommand?: string
} {
  const packageJsonPath = path.join(repoPath, "package.json")

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`CRITICAL: package.json missing at ${repoPath}`)
  }

  const stats = fs.statSync(packageJsonPath)
  if (stats.size > MAX_PACKAGE_JSON_SIZE) {
    throw new Error("package.json is too large")
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
  const deps = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  }

  const isTypescript = !!deps["typescript"] || fs.existsSync(path.join(repoPath, "tsconfig.json"))
  const startScript = (packageJson.scripts as Record<string, string>)?.start
  const hasIndexJs = fs.existsSync(path.join(repoPath, "index.js"))
  
  let suggestedStartCommand: string | undefined = undefined
  if (!startScript && hasIndexJs) {
    suggestedStartCommand = "node index.js"
  }

  if (deps["next"]) return { type: "nextjs", outDir: ".next", isTypescript, suggestedStartCommand }
  if (deps["vite"]) return { type: "vite", outDir: "dist", isTypescript, suggestedStartCommand }
  if (deps["react-scripts"]) return { type: "cra", outDir: "build", isTypescript, suggestedStartCommand }
  
  const isNodeFramework = deps["express"] || deps["fastify"] || deps["koa"] || deps["@nestjs/core"] || deps["hono"]
  if (isNodeFramework || startScript || hasIndexJs) {
    if (suggestedStartCommand) {
       logger.info({ repoPath }, `No start script found, but index.js exists. Using '${suggestedStartCommand}' as fallback.`)
    }
    return { type: "nodejs", outDir: "", isTypescript, suggestedStartCommand }
  }

  return { type: "unknown", outDir: "dist", isTypescript, suggestedStartCommand }
}

export function detectBuildTools(repoPath: string): BuildTools {
  const { type: projectType, outDir: outputDirectory, isTypescript, suggestedStartCommand } =
    detectProjectType(repoPath)

  const hasYarnLock = fs.existsSync(path.join(repoPath, "yarn.lock"))
  const hasPnpmLock = fs.existsSync(path.join(repoPath, "pnpm-lock.yaml"))
  const hasBunLock =
    fs.existsSync(path.join(repoPath, "bun.lockb")) ||
    fs.existsSync(path.join(repoPath, "bun.lock"))
  const hasNpmLock = fs.existsSync(path.join(repoPath, "package-lock.json"))

  const lockFilesFound = [
    hasPnpmLock,
    hasYarnLock,
    hasBunLock,
    hasNpmLock,
  ].filter(Boolean)
  if (lockFilesFound.length > 1) {
    logger.warn(
      { repoPath },
      "Multiple lock files detected — using highest priority match"
    )
  }

  if (hasPnpmLock)
    return {
      packageManager: "pnpm",
      installCommand: "pnpm install --frozen-lockfile",
      buildCommand: "pnpm run build",
      projectType,
      outputDirectory,
      isTypescript,
      suggestedStartCommand,
    }
  if (hasYarnLock)
    return {
      packageManager: "yarn",
      installCommand: "yarn install --frozen-lockfile",
      buildCommand: "yarn build",
      projectType,
      outputDirectory,
      isTypescript,
      suggestedStartCommand,
    }
  if (hasBunLock)
    return {
      packageManager: "bun",
      installCommand: "bun install --frozen-lockfile",
      buildCommand: "bun run build",
      projectType,
      outputDirectory,
      isTypescript,
      suggestedStartCommand,
    }
  if (hasNpmLock)
    return {
      packageManager: "npm",
      installCommand: "npm ci",
      buildCommand: "npm run build",
      projectType,
      outputDirectory,
      isTypescript,
      suggestedStartCommand,
    }

  return {
    packageManager: "npm",
    installCommand: "npm install",
    buildCommand: "npm run build",
    projectType,
    outputDirectory,
    isTypescript,
    suggestedStartCommand,
  }
}
