export function isPathActive(current: string, target: string) {
  if (target === "/dashboard") {
    return current === target
  }

  return current === target || current.startsWith(target + "/")
}

export function formatDateDistance(date: Date | string | number): string {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (diffInSeconds < 60) return "just now"

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30)
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12)
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`

  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`
}

export function parseUserAgent(ua: string | null | undefined) {
  if (!ua) return "Unknown Device"

  let browser = "Unknown Browser"
  if (ua.includes("Firefox")) browser = "Firefox"
  else if (ua.includes("Edg")) browser = "Edge"
  else if (ua.includes("Chrome") || ua.includes("CriOS")) browser = "Chrome"
  else if (ua.includes("Safari")) browser = "Safari"
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera"

  let os = "Unknown OS"
  if (ua.includes("Windows")) os = "Windows"
  else if (ua.includes("Mac OS X") || ua.includes("Macintosh")) os = "macOS"
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS"
  else if (ua.includes("Android")) os = "Android"
  else if (ua.includes("Linux")) os = "Linux"

  if (browser === "Unknown Browser" && os === "Unknown OS") {
    return ua.length > 30 ? ua.substring(0, 30) + "..." : ua
  }

  return `${browser} on ${os}`
}
