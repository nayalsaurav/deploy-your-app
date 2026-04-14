export const logger = {
  info: (data: any, message?: string) => {
    if (message) {
      console.log(`[INFO] ${message}`, data)
    } else {
      console.log(`[INFO]`, data)
    }
  },
  error: (data: any, message?: string) => {
    if (message) {
      console.error(`[ERROR] ${message}`, data)
    } else {
      console.error(`[ERROR]`, data)
    }
  },
  warn: (data: any, message?: string) => {
    if (message) {
      console.warn(`[WARN] ${message}`, data)
    } else {
      console.warn(`[WARN]`, data)
    }
  },
  debug: (data: any, message?: string) => {
    if (message) {
      console.debug(`[DEBUG] ${message}`, data)
    } else {
      console.debug(`[DEBUG]`, data)
    }
  },
}
