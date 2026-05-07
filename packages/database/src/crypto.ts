import crypto from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

/**
 * Encrypts a string using AES-256-GCM.
 * The Master Key should be 32 bytes (256 bits).
 */
export function encrypt(text: string, masterKey: string): string {
  if (!masterKey || masterKey.length < 32) {
    throw new Error("Encryption key must be at least 32 characters long")
  }

  const key = Buffer.from(masterKey.slice(0, 32))
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag().toString("hex")

  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag}:${encrypted}`
}

/**
 * Decrypts a string encrypted with the above function.
 */
export function decrypt(encryptedData: string, masterKey: string): string {
  if (!masterKey || masterKey.length < 32) {
    throw new Error("Encryption key must be at least 32 characters long")
  }

  const key = Buffer.from(masterKey.slice(0, 32))
  const [ivHex, authTagHex, encryptedText] = encryptedData.split(":")

  if (!ivHex || !authTagHex || !encryptedText) {
    throw new Error("Invalid encrypted data format")
  }

  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedText, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}
