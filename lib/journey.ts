import { supabase } from "@/lib/supabase"

export type JourneyProgress = {
  user_id: string
  xp: number
  level: number
  created_at: string
  updated_at: string
}

export type JourneyXpEvent = {
  id: string
  user_id: string
  event_key: string
  source: string
  xp: number
  metadata: Record<string, unknown>
  created_at: string
}

export type UserBadge = {
  id: string
  user_id: string
  badge_id: string
  unlocked_at: string
}

export type BadgeDefinition = {
  id: string
  icon: string
  title: {
    it: string
    en: string
  }
  description: {
    it: string
    en: string
  }
}

export type LevelSnapshot = {
  level: number
  title: string
  xp: number
  currentLevelXp: number
  nextLevelXp: number
  xpIntoLevel: number
  xpToNextLevel: number
  progressPercent: number
}

const BASE_LEVEL_XP = 120
const LEVEL_GROWTH = 1.1
const MAX_LEVEL = 100

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first_daily",
    icon: "🌱",
    title: {
      it: "Prima Daily",
      en: "First Daily",
    },
    description: {
      it: "Hai completato la tua prima Daily Word.",
      en: "You completed your first Daily Word.",
    },
  },
  {
    id: "perfect_daily",
    icon: "🎯",
    title: {
      it: "Colpo preciso",
      en: "Clean Hit",
    },
    description: {
      it: "Hai completato una Daily Word perfetta.",
      en: "You completed a perfect Daily Word.",
    },
  },
  {
    id: "daily_streak_3",
    icon: "🔥",
    title: {
      it: "Tre giorni",
      en: "Three Days",
    },
    description: {
      it: "Hai mantenuto una serie Daily di 3 giorni.",
      en: "You kept a 3-day Daily streak.",
    },
  },
  {
    id: "daily_streak_7",
    icon: "🗓️",
    title: {
      it: "Una settimana",
      en: "One Week",
    },
    description: {
      it: "Hai mantenuto una serie Daily di 7 giorni.",
      en: "You kept a 7-day Daily streak.",
    },
  },
  {
    id: "level_5",
    icon: "🧭",
    title: {
      it: "Esploratore",
      en: "Explorer",
    },
    description: {
      it: "Hai raggiunto il livello 5.",
      en: "You reached level 5.",
    },
  },
  {
    id: "level_10",
    icon: "📚",
    title: {
      it: "Studioso",
      en: "Scholar",
    },
    description: {
      it: "Hai raggiunto il livello 10.",
      en: "You reached level 10.",
    },
  },
  {
    id: "level_20",
    icon: "🌍",
    title: {
      it: "Poliglotta",
      en: "Polyglot",
    },
    description: {
      it: "Hai raggiunto il livello 20.",
      en: "You reached level 20.",
    },
  },
]

export function getXpRequiredForNextLevel(level: number) {
  const safeLevel = Math.max(1, level)

  return Math.round(BASE_LEVEL_XP * Math.pow(LEVEL_GROWTH, safeLevel - 1))
}

export function getTotalXpForLevel(level: number) {
  const safeLevel = Math.max(1, level)
  let total = 0

  for (let currentLevel = 1; currentLevel < safeLevel; currentLevel += 1) {
    total += getXpRequiredForNextLevel(currentLevel)
  }

  return total
}

export function getLevelFromXp(xp: number) {
  let level = 1
  let remainingXp = Math.max(0, xp)

  while (level < MAX_LEVEL) {
    const required = getXpRequiredForNextLevel(level)

    if (remainingXp < required) break

    remainingXp -= required
    level += 1
  }

  return level
}

export function getJourneyTitle(level: number, locale: "it" | "en") {
  if (level >= 50) return locale === "en" ? "Master of Languages" : "Maestro delle lingue"
  if (level >= 30) return locale === "en" ? "Archivist" : "Archivista"
  if (level >= 20) return locale === "en" ? "Polyglot" : "Poliglotta"
  if (level >= 10) return locale === "en" ? "Scholar" : "Studioso"
  if (level >= 5) return locale === "en" ? "Explorer" : "Esploratore"

  return locale === "en" ? "Novice" : "Novizio"
}

export function getLevelSnapshot(xp: number, locale: "it" | "en"): LevelSnapshot {
  const level = getLevelFromXp(xp)
  const currentLevelXp = getTotalXpForLevel(level)
  const nextLevelXp = getXpRequiredForNextLevel(level)
  const xpIntoLevel = Math.max(0, xp - currentLevelXp)
  const xpToNextLevel = Math.max(0, nextLevelXp - xpIntoLevel)
  const progressPercent =
    nextLevelXp > 0 ? Math.min(100, Math.round((xpIntoLevel / nextLevelXp) * 100)) : 100

  return {
    level,
    title: getJourneyTitle(level, locale),
    xp,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpToNextLevel,
    progressPercent,
  }
}

export function getDailyJourneyXp(score: number, totalQuestions: number) {
  const perfect = score === totalQuestions

  return perfect ? 60 : 40
}

export async function ensureJourneyProgress(userId: string) {
  const { data: existing, error: existingError } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) return existing as JourneyProgress

  const { data, error } = await supabase
    .from("user_progress")
    .insert({
      user_id: userId,
      xp: 0,
      level: 1,
    })
    .select("*")
    .single()

  if (error) {
    const { data: fallback, error: fallbackError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (fallbackError) throw fallbackError

    return fallback as JourneyProgress
  }

  return data as JourneyProgress
}

export async function getMyJourney(userId: string) {
  const progress = await ensureJourneyProgress(userId)

  const [{ data: badges, error: badgesError }, { data: events, error: eventsError }] =
    await Promise.all([
      supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", userId)
        .order("unlocked_at", { ascending: false }),
      supabase
        .from("user_xp_events")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30),
    ])

  if (badgesError) throw badgesError
  if (eventsError) throw eventsError

  return {
    progress,
    badges: (badges ?? []) as UserBadge[],
    events: (events ?? []) as JourneyXpEvent[],
  }
}

function getMetadataNumber(
  metadata: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = metadata?.[key]

  if (typeof value === "number") return value

  return 0
}

function getEligibleBadgeIds(input: {
  progress: JourneyProgress
  events: JourneyXpEvent[]
}) {
  const { progress, events } = input
  const eligible = new Set<string>()

  if (events.some((event) => event.source === "daily")) {
    eligible.add("first_daily")
  }

  if (
    events.some(
      (event) =>
        event.source === "daily" &&
        event.metadata &&
        event.metadata.correct === true
    )
  ) {
    eligible.add("perfect_daily")
  }

  if (
    events.some(
      (event) =>
        event.source === "daily" && getMetadataNumber(event.metadata, "streak") >= 3
    )
  ) {
    eligible.add("daily_streak_3")
  }

  if (
    events.some(
      (event) =>
        event.source === "daily" && getMetadataNumber(event.metadata, "streak") >= 7
    )
  ) {
    eligible.add("daily_streak_7")
  }

  if (progress.level >= 5) eligible.add("level_5")
  if (progress.level >= 10) eligible.add("level_10")
  if (progress.level >= 20) eligible.add("level_20")

  return Array.from(eligible)
}

async function unlockEligibleBadges(userId: string, progress: JourneyProgress) {
  const [{ data: events, error: eventsError }, { data: badges, error: badgesError }] =
    await Promise.all([
      supabase
        .from("user_xp_events")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("user_badges").select("*").eq("user_id", userId),
    ])

  if (eventsError) throw eventsError
  if (badgesError) throw badgesError

  const currentBadges = (badges ?? []) as UserBadge[]
  const currentBadgeIds = new Set(currentBadges.map((badge) => badge.badge_id))

  const eligibleBadgeIds = getEligibleBadgeIds({
    progress,
    events: (events ?? []) as JourneyXpEvent[],
  })

  const missingBadgeIds = eligibleBadgeIds.filter(
    (badgeId) => !currentBadgeIds.has(badgeId)
  )

  if (missingBadgeIds.length === 0) return [] as BadgeDefinition[]

  const rows = missingBadgeIds.map((badgeId) => ({
    user_id: userId,
    badge_id: badgeId,
  }))

  const { error } = await supabase.from("user_badges").insert(rows)

  if (error && error.code !== "23505") throw error

  return BADGE_DEFINITIONS.filter((badge) => missingBadgeIds.includes(badge.id))
}

export async function grantJourneyXp(input: {
  userId: string
  eventKey: string
  source: string
  xp: number
  metadata?: Record<string, unknown>
}) {
  const progress = await ensureJourneyProgress(input.userId)

  const { error: eventError } = await supabase.from("user_xp_events").insert({
    user_id: input.userId,
    event_key: input.eventKey,
    source: input.source,
    xp: input.xp,
    metadata: input.metadata ?? {},
  })

  if (eventError) {
    if (eventError.code === "23505") {
      return {
        awarded: false,
        xpAwarded: 0,
        progress,
        unlockedBadges: [] as BadgeDefinition[],
      }
    }

    throw eventError
  }

  const nextXp = progress.xp + input.xp
  const nextLevel = getLevelFromXp(nextXp)

  const { data: updatedProgress, error: updateError } = await supabase
    .from("user_progress")
    .update({
      xp: nextXp,
      level: nextLevel,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", input.userId)
    .select("*")
    .single()

  if (updateError) throw updateError

  const unlockedBadges = await unlockEligibleBadges(
    input.userId,
    updatedProgress as JourneyProgress
  )

  return {
    awarded: true,
    xpAwarded: input.xp,
    progress: updatedProgress as JourneyProgress,
    unlockedBadges,
  }
}

export async function grantDailyJourneyXp(input: {
  userId: string
  dailyKey: string
  score: number
  totalQuestions: number
  streak: number
}) {
  const xp = getDailyJourneyXp(input.score, input.totalQuestions)

  return grantJourneyXp({
    userId: input.userId,
    eventKey: `daily:${input.dailyKey}`,
    source: "daily",
    xp,
    metadata: {
      daily_key: input.dailyKey,
      score: input.score,
      total_questions: input.totalQuestions,
      correct: input.score === input.totalQuestions,
      streak: input.streak,
    },
  })
}