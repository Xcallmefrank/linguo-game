export function getPlayerToken() {
  if (typeof window === "undefined") return ""

  const existing = localStorage.getItem("linguo_player_token")
  if (existing) return existing

  const token =
    crypto.randomUUID?.() ??
    `player_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  localStorage.setItem("linguo_player_token", token)
  return token
}