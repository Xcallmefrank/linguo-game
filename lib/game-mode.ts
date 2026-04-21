import { Question, questions } from "@/lib/questions"
import { getLanguageGroup } from "@/lib/language-groups"

export type GameMode = "normal" | "hard" | "similar"

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  normal: "Normale",
  hard: "Difficile",
  similar: "Lingue simili",
}

export const GAME_MODE_DESCRIPTIONS: Record<GameMode, string> = {
  normal: "Varietà bilanciata e ritmo pulito.",
  hard: "Più ambiguità, meno pietà.",
  similar: "Lingue vicine. Errori più umilianti.",
}

const HARD_QUESTION_IDS = [
  2, 3, 9, 10, 13, 14, 15, 18, 21, 22, 23, 24, 27, 29, 30, 31, 32, 33, 36, 38,
  39, 40, 41, 42, 45, 47, 48, 49, 50, 51, 52, 54, 55, 56, 57, 58, 59, 60, 61,
  62, 63, 64, 65, 66, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84,
  85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96,
]

const SIMILAR_QUESTION_IDS = [
  2, 3, 9, 10, 13, 14, 15, 18, 21, 22, 23, 24, 27, 30, 31, 32, 33, 36, 39, 40,
  41, 42, 45, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
  64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
  83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96,
]

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]

  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }

  return newArray
}

function buildGroupBuckets(pool: Question[]) {
  const buckets = new Map<string, Question[]>()

  for (const question of pool) {
    const group = getLanguageGroup(question.correct)

    if (!buckets.has(group)) {
      buckets.set(group, [])
    }

    buckets.get(group)!.push(question)
  }

  for (const [group, items] of buckets.entries()) {
    buckets.set(group, shuffleArray(items))
  }

  return buckets
}

function takeOneFromGroup(
  buckets: Map<string, Question[]>,
  group: string
): Question | null {
  const bucket = buckets.get(group)
  if (!bucket || bucket.length === 0) return null
  return bucket.shift() ?? null
}

function getNonEmptyGroups(buckets: Map<string, Question[]>) {
  return Array.from(buckets.entries())
    .filter(([, items]) => items.length > 0)
    .map(([group]) => group)
}

function buildBalancedNormal(pool: Question[], count: number) {
  const buckets = buildGroupBuckets(pool)
  const result: Question[] = []
  let lastGroup: string | null = null
  let streak = 0

  while (result.length < count) {
    const groups = getNonEmptyGroups(buckets)
    if (groups.length === 0) break

    let candidates = groups

    if (lastGroup && streak >= 2) {
      const filtered = groups.filter((group) => group !== lastGroup)
      if (filtered.length > 0) {
        candidates = filtered
      }
    }

    const nextGroup = shuffleArray(candidates)[0]
    const picked = takeOneFromGroup(buckets, nextGroup)

    if (!picked) continue

    result.push(picked)

    if (nextGroup === lastGroup) {
      streak += 1
    } else {
      lastGroup = nextGroup
      streak = 1
    }
  }

  return result
}

function buildBalancedHard(pool: Question[], count: number) {
  const shuffled = shuffleArray(pool)
  const result: Question[] = []
  let lastGroup: string | null = null
  let streak = 0

  for (const question of shuffled) {
    if (result.length >= count) break

    const group = getLanguageGroup(question.correct)

    if (group === lastGroup && streak >= 2) {
      continue
    }

    result.push(question)

    if (group === lastGroup) {
      streak += 1
    } else {
      lastGroup = group
      streak = 1
    }
  }

  if (result.length < count) {
    for (const question of shuffled) {
      if (result.length >= count) break
      if (!result.some((q) => q.id === question.id)) {
        result.push(question)
      }
    }
  }

  return result
}

function buildBalancedSimilar(pool: Question[], count: number) {
  const buckets = buildGroupBuckets(pool)
  const result: Question[] = []

  const groups = shuffleArray(getNonEmptyGroups(buckets)).slice(0, 4)
  const targetGroups = groups.length > 0 ? groups : getNonEmptyGroups(buckets)

  while (result.length < count) {
    let added = false

    for (const group of targetGroups) {
      if (result.length >= count) break

      const picked = takeOneFromGroup(buckets, group)
      if (picked) {
        result.push(picked)
        added = true
      }
    }

    if (!added) break
  }

  if (result.length < count) {
    const remaining = shuffleArray(pool).filter(
      (question) => !result.some((picked) => picked.id === question.id)
    )

    for (const question of remaining) {
      if (result.length >= count) break
      result.push(question)
    }
  }

  return result
}

export function getQuestionsForMode(mode: GameMode, count = 10): Question[] {
  if (mode === "hard") {
    const pool = questions.filter((q) => HARD_QUESTION_IDS.includes(q.id))
    return buildBalancedHard(pool, count)
  }

  if (mode === "similar") {
    const pool = questions.filter((q) => SIMILAR_QUESTION_IDS.includes(q.id))
    return buildBalancedSimilar(pool, count)
  }

  return buildBalancedNormal(questions, count)
}

export function getResultMessage(mode: GameMode, score: number, total: number) {
  const ratio = score / total

  if (mode === "hard") {
    if (ratio <= 0.3) return "Le lingue ti hanno preso a schiaffi con eleganza."
    if (ratio <= 0.6) return "Hai resistito. Non benissimo, ma hai resistito."
    if (ratio <= 0.8) return "Qui inizi a fare paura."
    return "O sei fortissimo, o sei un problema per tutti."
  }

  if (mode === "similar") {
    if (ratio <= 0.3) return "Hai confuso intere famiglie linguistiche."
    if (ratio <= 0.6) return "Ti sei perso nei dettagli."
    if (ratio <= 0.8) return "Hai orecchio fine."
    return "Distinguere il quasi uguale è roba da maniaci. Complimenti."
  }

  if (ratio <= 0.3) return "Hai litigato con mezzo pianeta."
  if (ratio <= 0.6) return "Ti orienti, ma con qualche incidente linguistico."
  if (ratio <= 0.8) return "Hai un buon occhio."
  return "Pericolosamente vicino al poliglotta."
}