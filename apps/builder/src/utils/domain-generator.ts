import { prisma } from "@workspace/database"
import crypto from "node:crypto"

const ADJECTIVES = [
  "agile",
  "alert",
  "bold",
  "brave",
  "calm",
  "clever",
  "cool",
  "crisp",
  "eager",
  "epic",
  "fast",
  "fierce",
  "fresh",
  "gentle",
  "grand",
  "happy",
  "jolly",
  "keen",
  "kind",
  "lively",
  "neat",
  "neon",
  "nice",
  "posh",
  "proud",
  "rare",
  "rich",
  "shy",
  "silly",
  "smart",
  "swift",
  "warm",
  "wild",
  "zesty",
]

const NOUNS = [
  "bear",
  "bird",
  "cat",
  "cloud",
  "cow",
  "crab",
  "deer",
  "dog",
  "dove",
  "duck",
  "eagle",
  "fish",
  "fox",
  "frog",
  "goat",
  "hawk",
  "horse",
  "koala",
  "leaf",
  "lion",
  "moon",
  "owl",
  "panda",
  "peak",
  "rock",
  "seal",
  "shark",
  "sheep",
  "star",
  "storm",
  "sun",
  "swan",
  "tiger",
  "tree",
  "valley",
  "wave",
  "whale",
  "wind",
  "wolf",
]

export function generateRandomSubdomain(projectName?: string): string {
  const randomAdjective =
    ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const randomNoun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const randomHash = crypto.randomBytes(3).toString("hex")

  let prefix = ""

  if (projectName) {
    prefix = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    if (prefix) {
      prefix += "-"
    }
  }

  return `${prefix}${randomAdjective}-${randomNoun}-${randomHash}`
}

export async function generateUniqueSubdomain(
  projectName?: string,
  maxAttempts = 5
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const subdomain = generateRandomSubdomain(projectName)

    // Verify it isn't taken in the database
    const existingDeployment = await prisma.project.findFirst({
      where: {
        deploymentUrl: subdomain,
      },
    })

    if (!existingDeployment) {
      return subdomain
    }

    // Log collision if it happens
    console.warn(
      `Collision detected for generated subdomain: ${subdomain}, trying again...`
    )
  }

  throw new Error(
    "Unable to generate a unique subdomain after maximum attempts."
  )
}
