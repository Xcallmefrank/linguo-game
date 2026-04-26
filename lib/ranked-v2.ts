import { supabase } from "@/lib/supabase"

export type RankedSeason = {
  id: string
  season_number: number
  display_name: string
  starts_at: string
  ends_at: string
  question_ids: number[]
  is_active: boolean
}

export type RankedRun = {
  id: string
  season_id: string
  user_id: string
  run_number: number
  score: number
  total_questions: number
  total_time_ms: number
  accuracy_percent: number
  answers: unknown
  created_at: string
  updated_at: string
}

export type RankedLeaderboardEntry = {
  user_id: string
  nickname: string
  country_code: string
  runs_completed: number
  avg_score: number
  avg_accuracy: number
  avg_time_ms: number
}

export type RankedStanding = {
  runs_completed: number
  max_runs: number
  avg_score: number | null
  avg_accuracy: number | null
  avg_time_ms: number | null
  is_official: boolean
  position: number | null
  total_ranked_users: number
}

function mapSeasonRow(row: any): RankedSeason {
  return {
    id: row.id,
    season_number: row.season_number,
    display_name: row.display_name,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    question_ids: (row.question_ids ?? []) as number[],
    is_active: Boolean(row.is_active),
  }
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function sortLeaderboard(
  a: RankedLeaderboardEntry,
  b: RankedLeaderboardEntry
) {
  if (b.avg_score !== a.avg_score) return b.avg_score - a.avg_score
  if (b.avg_accuracy !== a.avg_accuracy) return b.avg_accuracy - a.avg_accuracy
  return a.avg_time_ms - b.avg_time_ms
}

export async function getActiveRankedSeason() {
  const { data, error } = await supabase
    .from("ranked_seasons")
    .select("*")
    .eq("is_active", true)
    .order("season_number", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new Error("Nessuna ranked season attiva trovata.")
  }

  const season = mapSeasonRow(data)

  if (season.question_ids.length < 30) {
    throw new Error(
      "La season attiva non ha abbastanza domande. Servono almeno 30 question_ids."
    )
  }

  return season
}

export async function getMyRankedRuns(seasonId: string, userId: string) {
  const { data, error } = await supabase
    .from("ranked_runs")
    .select("*")
    .eq("season_id", seasonId)
    .eq("user_id", userId)
    .order("run_number", { ascending: true })

  if (error) throw error
  return (data ?? []) as RankedRun[]
}

export async function getNextRunNumber(seasonId: string, userId: string) {
  const runs = await getMyRankedRuns(seasonId, userId)
  const next = runs.length + 1

  if (next > 3) return null
  return next
}

export function getQuestionsForRun(season: RankedSeason, runNumber: number) {
  if (runNumber < 1 || runNumber > 3) {
    throw new Error("Run number non valido.")
  }

  const start = (runNumber - 1) * 10
  const end = start + 10
  const ids = season.question_ids.slice(start, end)

  if (ids.length !== 10) {
    throw new Error("La season non contiene 10 domande valide per questa run.")
  }

  return ids
}

export async function submitRankedRun(input: {
  seasonId: string
  userId: string
  score: number
  totalQuestions: number
  totalTimeMs: number
  answers: unknown
}) {
  const existingRuns = await getMyRankedRuns(input.seasonId, input.userId)

  if (existingRuns.length >= 3) {
    throw new Error("Hai già completato tutte e 3 le run di questa season.")
  }

  const runNumber = existingRuns.length + 1
  const accuracyPercent = Number(
    ((input.score / input.totalQuestions) * 100).toFixed(2)
  )

  const { data, error } = await supabase
    .from("ranked_runs")
    .insert({
      season_id: input.seasonId,
      user_id: input.userId,
      run_number: runNumber,
      score: input.score,
      total_questions: input.totalQuestions,
      total_time_ms: input.totalTimeMs,
      accuracy_percent: accuracyPercent,
      answers: input.answers,
    })
    .select("*")
    .single()

  if (error) throw error

  return {
    run: data as RankedRun,
    runNumber,
    runsCompleted: runNumber,
    runsRemaining: Math.max(0, 3 - runNumber),
  }
}

export async function getRankedLeaderboard(seasonId: string) {
  const { data: runs, error: runsError } = await supabase
    .from("ranked_runs")
    .select("user_id, score, accuracy_percent, total_time_ms, run_number")
    .eq("season_id", seasonId)

  if (runsError) throw runsError

  const allRuns = (runs ?? []) as Array<{
    user_id: string
    score: number
    accuracy_percent: number
    total_time_ms: number
    run_number: number
  }>

  const grouped = new Map<string, typeof allRuns>()

  for (const run of allRuns) {
    const current = grouped.get(run.user_id) ?? []
    current.push(run)
    grouped.set(run.user_id, current)
  }

  const officialUserIds = [...grouped.entries()]
    .filter(([, userRuns]) => userRuns.length === 3)
    .map(([userId]) => userId)

  if (officialUserIds.length === 0) {
    return [] as RankedLeaderboardEntry[]
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, nickname, country_code")
    .in("id", officialUserIds)

  if (profilesError) throw profilesError

  const profilesMap = new Map(
    (profiles ?? []).map((profile: any) => [
      profile.id,
      {
        nickname: profile.nickname,
        country_code: profile.country_code,
      },
    ])
  )

  const leaderboard: RankedLeaderboardEntry[] = officialUserIds
    .map((userId) => {
      const userRuns = grouped.get(userId) ?? []
      const profile = profilesMap.get(userId)

      if (!profile || userRuns.length !== 3) return null

      return {
        user_id: userId,
        nickname: profile.nickname,
        country_code: profile.country_code,
        runs_completed: 3,
        avg_score: Number(average(userRuns.map((r) => r.score)).toFixed(2)),
        avg_accuracy: Number(
          average(userRuns.map((r) => r.accuracy_percent)).toFixed(2)
        ),
        avg_time_ms: Math.round(average(userRuns.map((r) => r.total_time_ms))),
      }
    })
    .filter(Boolean) as RankedLeaderboardEntry[]

  leaderboard.sort(sortLeaderboard)

  return leaderboard.slice(0, 25)
}

export async function getMyRankedStanding(seasonId: string, userId: string) {
  const myRuns = await getMyRankedRuns(seasonId, userId)

  const runsCompleted = myRuns.length
  const avgScore =
    runsCompleted > 0
      ? Number(average(myRuns.map((r) => r.score)).toFixed(2))
      : null
  const avgAccuracy =
    runsCompleted > 0
      ? Number(average(myRuns.map((r) => r.accuracy_percent)).toFixed(2))
      : null
  const avgTimeMs =
    runsCompleted > 0
      ? Math.round(average(myRuns.map((r) => r.total_time_ms)))
      : null

  if (runsCompleted < 3) {
    return {
      runs_completed: runsCompleted,
      max_runs: 3,
      avg_score: avgScore,
      avg_accuracy: avgAccuracy,
      avg_time_ms: avgTimeMs,
      is_official: false,
      position: null,
      total_ranked_users: 0,
    } satisfies RankedStanding
  }

  const { data: runs, error } = await supabase
    .from("ranked_runs")
    .select("user_id, score, accuracy_percent, total_time_ms")
    .eq("season_id", seasonId)

  if (error) throw error

  const allRuns = (runs ?? []) as Array<{
    user_id: string
    score: number
    accuracy_percent: number
    total_time_ms: number
  }>

  const grouped = new Map<string, typeof allRuns>()

  for (const run of allRuns) {
    const current = grouped.get(run.user_id) ?? []
    current.push(run)
    grouped.set(run.user_id, current)
  }

  const officialLeaderboard: RankedLeaderboardEntry[] = [...grouped.entries()]
    .filter(([, userRuns]) => userRuns.length === 3)
    .map(([entryUserId, userRuns]) => ({
      user_id: entryUserId,
      nickname: "",
      country_code: "",
      runs_completed: 3,
      avg_score: Number(average(userRuns.map((r) => r.score)).toFixed(2)),
      avg_accuracy: Number(
        average(userRuns.map((r) => r.accuracy_percent)).toFixed(2)
      ),
      avg_time_ms: Math.round(average(userRuns.map((r) => r.total_time_ms))),
    }))

  officialLeaderboard.sort(sortLeaderboard)

  const position =
    officialLeaderboard.findIndex((entry) => entry.user_id === userId) + 1

  return {
    runs_completed: runsCompleted,
    max_runs: 3,
    avg_score: avgScore,
    avg_accuracy: avgAccuracy,
    avg_time_ms: avgTimeMs,
    is_official: true,
    position: position > 0 ? position : null,
    total_ranked_users: officialLeaderboard.length,
  } satisfies RankedStanding
}