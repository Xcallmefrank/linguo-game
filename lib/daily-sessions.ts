import { supabase } from "@/lib/supabase"

export type DailyAnswer = {
  questionId: string
  prompt: string
  selectedAnswer: string
  correctAnswer: string
  correct: boolean
}

export type DailyAttempt = {
  id: string
  user_id: string
  daily_key: string
  word_id: number
  score: number
  total_questions: number
  answers: DailyAnswer[]
  created_at: string
}

export async function getMyDailyAttempt(userId: string, dailyKey: string) {
  const { data, error } = await supabase
    .from("daily_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("daily_key", dailyKey)
    .maybeSingle()

  if (error) throw error

  return (data ?? null) as DailyAttempt | null
}

export async function saveDailyAttempt(input: {
  userId: string
  dailyKey: string
  wordId: number
  score: number
  totalQuestions: number
  answers: DailyAnswer[]
}) {
  const { data, error } = await supabase
    .from("daily_attempts")
    .insert({
      user_id: input.userId,
      daily_key: input.dailyKey,
      word_id: input.wordId,
      score: input.score,
      total_questions: input.totalQuestions,
      answers: input.answers,
    })
    .select("*")
    .single()

  if (error) throw error

  return data as DailyAttempt
}

export async function getMyRecentDailyAttempts(userId: string, limit = 40) {
  const { data, error } = await supabase
    .from("daily_attempts")
    .select("*")
    .eq("user_id", userId)
    .order("daily_key", { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []) as DailyAttempt[]
}

function previousDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  date.setDate(date.getDate() - 1)

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")

  return `${y}-${m}-${d}`
}

export function calculateDailyStreak(attempts: DailyAttempt[], todayKey: string) {
  const completed = new Set(attempts.map((attempt) => attempt.daily_key))
  let cursor = todayKey
  let streak = 0

  while (completed.has(cursor)) {
    streak += 1
    cursor = previousDateKey(cursor)
  }

  return streak
}
