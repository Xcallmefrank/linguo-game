import { supabase } from "@/lib/supabase"
import { getPlayerToken } from "@/lib/player-token"

type SubmitRankedEntryInput = {
  seasonId: string
  nickname: string
  countryCode: string
  score: number
  totalQuestions: number
  totalTimeMs: number
  answers: unknown
}

function isBetterScore(
  incomingScore: number,
  incomingTime: number,
  existingScore: number,
  existingTime: number
) {
  if (incomingScore > existingScore) return true
  if (incomingScore === existingScore && incomingTime < existingTime) return true
  return false
}

export async function submitRankedEntry(input: SubmitRankedEntryInput) {
  const playerToken = getPlayerToken()
  const cleanNickname = input.nickname.trim().slice(0, 14)
  const accuracyPercent = Number(
    ((input.score / input.totalQuestions) * 100).toFixed(2)
  )

  const { data: nicknameOwner, error: nicknameError } = await supabase
    .from("ranked_entries")
    .select("id, player_token")
    .eq("season_id", input.seasonId)
    .ilike("nickname", cleanNickname)
    .maybeSingle()

  if (nicknameError) throw nicknameError

  if (nicknameOwner && nicknameOwner.player_token !== playerToken) {
    throw new Error("Nickname già utilizzato in questa season.")
  }

  const { data: existing, error: existingError } = await supabase
    .from("ranked_entries")
    .select("*")
    .eq("season_id", input.seasonId)
    .eq("player_token", playerToken)
    .maybeSingle()

  if (existingError) throw existingError

  if (!existing) {
    const { error } = await supabase.from("ranked_entries").insert({
      season_id: input.seasonId,
      player_token: playerToken,
      nickname: cleanNickname,
      country_code: input.countryCode,
      score: input.score,
      total_questions: input.totalQuestions,
      total_time_ms: input.totalTimeMs,
      accuracy_percent: accuracyPercent,
      answers: input.answers,
    })

    if (error) throw error
    return { status: "inserted" as const }
  }

  const shouldUpdate = isBetterScore(
    input.score,
    input.totalTimeMs,
    existing.score,
    existing.total_time_ms
  )

  if (!shouldUpdate) {
    return { status: "kept_existing" as const }
  }

  const { error } = await supabase
    .from("ranked_entries")
    .update({
      nickname: cleanNickname,
      country_code: input.countryCode,
      score: input.score,
      total_questions: input.totalQuestions,
      total_time_ms: input.totalTimeMs,
      accuracy_percent: accuracyPercent,
      answers: input.answers,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)

  if (error) throw error

  return { status: "updated" as const }
}