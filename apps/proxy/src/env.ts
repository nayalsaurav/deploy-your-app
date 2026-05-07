function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const R2_PUBLIC_URL = requireEnv("R2_PUBLIC_URL").replace(/\/$/, "")
export const BASE_DOMAIN = requireEnv("BASE_DOMAIN")
export const PORT = parseInt(process.env.PORT || "8080", 10)
