export function isPathActive(current: string, target: string) {
  if (target === "/dashboard") {
    return current === target
  }

  return current === target || current.startsWith(target + "/")
}
