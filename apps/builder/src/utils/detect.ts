import fs from "node:fs"
import path from "node:path"
import { logger } from "../utils/logger"

export type ProjectType = "nextjs" | "vite" | "cra" | "unknown"

export interface BuildTools {
  packageManager: "npm" | "yarn" | "pnpm" | "bun"
  installCommand: string
  buildCommand: string
  projectType: ProjectType
  outputDirectory: string
}

const MAX_PACKAGE_JSON_SIZE = 1024 * 1024 // 1MB
const SAFE_BUILD_SCRIPT = /^(next build|vite build|tsc|react-scripts build)$/

export function detectProjectType(repoPath: string): {
  type: ProjectType
  outDir: string
} {
  const packageJsonPath = path.join(repoPath, "package.json")

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`No package.json found at ${repoPath}`)
  }

  const stat = fs.statSync(packageJsonPath)
  if (stat.size > MAX_PACKAGE_JSON_SIZE) {
    throw new Error("package.json exceeds maximum allowed size (1MB)")
  }

  let packageJson: Record<string, unknown>
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
  } catch (error) {
    logger.error({ repoPath, error }, "Failed to parse package.json")
    throw new Error("Failed to parse package.json")
  }

  const buildScript =
    typeof packageJson?.scripts === "object"
      ? ((packageJson.scripts as Record<string, string>)?.build ?? "")
      : ""

  if (buildScript && !SAFE_BUILD_SCRIPT.test(buildScript.trim())) {
    throw new Error(`Untrusted build script detected: "${buildScript}"`)
  }

  const deps = {
    ...(typeof packageJson.dependencies === "object" &&
    packageJson.dependencies !== null
      ? (packageJson.dependencies as Record<string, string>)
      : {}),
    ...(typeof packageJson.devDependencies === "object" &&
    packageJson.devDependencies !== null
      ? (packageJson.devDependencies as Record<string, string>)
      : {}),
  }

  if (deps["next"]) return { type: "nextjs", outDir: ".next" }
  if (deps["vite"]) return { type: "vite", outDir: "dist" }
  if (deps["react-scripts"]) return { type: "cra", outDir: "build" }

  return { type: "unknown", outDir: "dist" }
}

export function detectBuildTools(repoPath: string): BuildTools {
  const { type: projectType, outDir: outputDirectory } =
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
    }
  if (hasYarnLock)
    return {
      packageManager: "yarn",
      installCommand: "yarn install --frozen-lockfile",
      buildCommand: "yarn build",
      projectType,
      outputDirectory,
    }
  if (hasBunLock)
    return {
      packageManager: "bun",
      installCommand: "bun install --frozen-lockfile",
      buildCommand: "bun run build",
      projectType,
      outputDirectory,
    }
  if (hasNpmLock)
    return {
      packageManager: "npm",
      installCommand: "npm ci",
      buildCommand: "npm run build",
      projectType,
      outputDirectory,
    }

  return {
    packageManager: "npm",
    installCommand: "npm install",
    buildCommand: "npm run build",
    projectType,
    outputDirectory,
  }
}
