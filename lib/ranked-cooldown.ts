const RANKED_COOLDOWN_MS = 24 * 60 * 60 * 1000

export function getRankedCooldownMs() {
  if (typeof window === "undefined") return 0

  const lastAttempt = localStorage.getItem("linguo_ranked_last_attempt_at")
  if (!lastAttempt) return 0

  const diff = Date.now() - Number(lastAttempt)
  return Math.max(0, RANKED_COOLDOWN_MS - diff)
}

export function setRankedLastAttemptNow() {
  if (typeof window === "undefined") return
  localStorage.setItem("linguo_ranked_last_attempt_at", String(Date.now()))
}

export function formatCooldown(ms: number, locale: "it" | "en") {
  const totalSeconds = Math.ceil(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (locale === "en") {
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    return `${hours}h ${minutes}m`
  }

  if (days > 0) return `${days}g ${hours}h ${minutes}m`
  return `${hours}h ${minutes}m`
}