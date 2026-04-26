import { supabase } from "@/lib/supabase"

export type GameMode = "normal" | "hard" | "similar"

export type GameSession = {
  id: string
  user_id: string
  mode: GameMode
  score: number
  total_questions: number
  accuracy_percent: number
  total_time_ms: number | null
  best_streak: number | null
  answers: unknown
  created_at: string
}

export type GameOverviewStats = {
  totalGames: number
  averageAccuracy: number
  bestScore: number
  bestStreak: number
}

export type GameModeStats = {
  mode: GameMode
  gamesPlayed: number
  averageAccuracy: number
  bestScore: number
  averageTimeMs: number | null
}

export async function saveGameSession(input: {
  userId: string
  mode: GameMode
  score: number
  totalQuestions: number
  totalTimeMs?: number | null
  bestStreak?: number | null
  answers?: unknown
}) {
  const accuracyPercent = Number(
    ((input.score / input.totalQuestions) * 100).toFixed(2)
  )

  const { error } = await supabase.from("game_sessions").insert({
    user_id: input.userId,
    mode: input.mode,
    score: input.score,
    total_questions: input.totalQuestions,
    accuracy_percent: accuracyPercent,
    total_time_ms: input.totalTimeMs ?? null,
    best_streak: input.bestStreak ?? null,
    answers: input.answers ?? null,
  })

  if (error) throw error
}

export async function getMyRecentGameSessions(userId: string, limit = 12) {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as GameSession[]
}

export async function getMyGameOverviewStats(
  userId: string
): Promise<GameOverviewStats> {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("score, accuracy_percent, best_streak")
    .eq("user_id", userId)

  if (error) throw error

  const sessions = data ?? []

  if (sessions.length === 0) {
    return {
      totalGames: 0,
      averageAccuracy: 0,
      bestScore: 0,
      bestStreak: 0,
    }
  }

  const totalGames = sessions.length
  const averageAccuracy = Number(
    (
      sessions.reduce((sum, s) => sum + Number(s.accuracy_percent ?? 0), 0) /
      totalGames
    ).toFixed(2)
  )
  const bestScore = Math.max(...sessions.map((s) => Number(s.score ?? 0)))
  const bestStreak = Math.max(...sessions.map((s) => Number(s.best_streak ?? 0)))

  return {
    totalGames,
    averageAccuracy,
    bestScore,
    bestStreak,
  }
}

export async function getMyGameModeStats(
  userId: string
): Promise<GameModeStats[]> {
  const { data, error } = await supabase
    .from("game_sessions")
    .select("mode, score, accuracy_percent, total_time_ms")
    .eq("user_id", userId)

  if (error) throw error

  const sessions = (data ?? []) as Array<{
    mode: GameMode
    score: number
    accuracy_percent: number
    total_time_ms: number | null
  }>

  const modes: GameMode[] = ["normal", "hard", "similar"]

  return modes.map((mode) => {
    const modeSessions = sessions.filter((s) => s.mode === mode)

    if (modeSessions.length === 0) {
      return {
        mode,
        gamesPlayed: 0,
        averageAccuracy: 0,
        bestScore: 0,
        averageTimeMs: null,
      }
    }

    const averageAccuracy = Number(
      (
        modeSessions.reduce((sum, s) => sum + Number(s.accuracy_percent ?? 0), 0) /
        modeSessions.length
      ).toFixed(2)
    )

    const timedSessions = modeSessions.filter(
      (s) => typeof s.total_time_ms === "number"
    )

    const averageTimeMs =
      timedSessions.length > 0
        ? Math.round(
            timedSessions.reduce((sum, s) => sum + Number(s.total_time_ms ?? 0), 0) /
              timedSessions.length
          )
        : null

    return {
      mode,
      gamesPlayed: modeSessions.length,
      averageAccuracy,
      bestScore: Math.max(...modeSessions.map((s) => Number(s.score ?? 0))),
      averageTimeMs,
    }
  })
}