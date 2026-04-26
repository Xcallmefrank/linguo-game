import { supabase } from "@/lib/supabase"
import { getQuestionsForMode } from "@/lib/game-mode"

export type RankedSeason = {
  id: string
  season_key: string
  season_number: number
  display_name: string
  starts_at: string
  ends_at: string
  question_ids: number[]
  is_active: boolean
}

export type RankedEntry = {
  id: string
  season_id: string
  player_token: string
  nickname: string
  country_code: string
  score: number
  total_questions: number
  total_time_ms: number
  accuracy_percent: number
  answers: unknown
  created_at: string
  updated_at: string
}

function seededRandom(seed: number) {
  let value = seed % 2147483647
  if (value <= 0) value += 2147483646

  return function () {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array]
  const random = seededRandom(seed)

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

function generateSeasonQuestionIds(seed: number) {
  const hardPool = getQuestionsForMode("hard", 500)
  return seededShuffle(hardPool, seed).slice(0, 15).map((q) => q.id)
}

function mapSeasonRow(row: any): RankedSeason {
  return {
    ...row,
    season_number: row.season_number ?? 0,
    display_name: row.display_name ?? `Season ${row.season_number ?? 0}`,
    question_ids: (row.question_ids ?? []) as number[],
    is_active: Boolean(row.is_active),
  }
}

async function fetchActiveSeason() {
  const { data, error } = await supabase
    .from("ranked_seasons")
    .select("*")
    .eq("is_active", true)
    .order("season_number", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapSeasonRow(data)
}

async function fetchSeasonByNumber(seasonNumber: number) {
  const { data, error } = await supabase
    .from("ranked_seasons")
    .select("*")
    .eq("season_number", seasonNumber)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapSeasonRow(data)
}

async function bootstrapSeasonZero() {
  const existing = await fetchSeasonByNumber(0)
  if (existing) return existing

  const questionIds = generateSeasonQuestionIds(7000)

  const { data, error } = await supabase
    .from("ranked_seasons")
    .insert({
      season_key: "season_0",
      season_number: 0,
      display_name: "Season 0",
      starts_at: "2026-04-26T00:00:00.000Z",
      ends_at: "2026-05-31T23:59:59.000Z",
      question_ids: questionIds,
      is_active: true,
    })
    .select("*")
    .maybeSingle()

  if (!error && data) {
    return mapSeasonRow(data)
  }

  if (error?.code === "23505") {
    const createdByAnotherRequest = await fetchSeasonByNumber(0)
    if (createdByAnotherRequest) return createdByAnotherRequest
  }

  console.error("Errore bootstrap Season 0:", error)
  throw new Error(error?.message || "Impossibile creare Season 0.")
}

export async function getActiveRankedSeason() {
  const active = await fetchActiveSeason()
  if (active) return active

  return bootstrapSeasonZero()
}

export async function getRankedSeasonHistory() {
  const { data, error } = await supabase
    .from("ranked_seasons")
    .select("*")
    .order("season_number", { ascending: false })

  if (error) throw error

  return (data ?? []).map(mapSeasonRow)
}

export async function getRankedLeaderboard(seasonId: string) {
  const { data, error } = await supabase
    .from("ranked_entries")
    .select("*")
    .eq("season_id", seasonId)
    .order("score", { ascending: false })
    .order("total_time_ms", { ascending: true })
    .limit(50)

  if (error) throw error
  return (data ?? []) as RankedEntry[]
}

export async function getRankedPositionForPlayer(
  seasonId: string,
  playerToken: string
) {
  const { data, error } = await supabase
    .from("ranked_entries")
    .select("id, player_token, score, total_time_ms")
    .eq("season_id", seasonId)
    .order("score", { ascending: false })
    .order("total_time_ms", { ascending: true })

  if (error) throw error

  const full = data ?? []
  const position =
    full.findIndex((entry) => entry.player_token === playerToken) + 1

  return {
    position: position > 0 ? position : null,
    total: full.length,
  }
}