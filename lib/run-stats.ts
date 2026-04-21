import { PlayerAnswer } from "@/lib/challenge"
import { questions } from "@/lib/questions"
import { getLanguageGroup } from "@/lib/language-groups"

type FamilyLabel = "Romanze" | "Germaniche" | "Slave" | "Mediorientali" | "Asiatiche" | "Altre"

type FamilySummary = {
  key: string
  label: FamilyLabel
  correct: number
  total: number
  accuracy: number
}

export type RunStats = {
  bestStreak: number
  nonLatinCorrect: number
  bestFamily: FamilySummary | null
}

const NON_LATIN_GROUPS = new Set(["slavic", "middleEastern", "eastAsian"])

function getFamilyLabel(group: string): FamilyLabel {
  switch (group) {
    case "romance":
      return "Romanze"
    case "germanic":
      return "Germaniche"
    case "slavic":
      return "Slave"
    case "middleEastern":
      return "Mediorientali"
    case "eastAsian":
      return "Asiatiche"
    default:
      return "Altre"
  }
}

export function getRunStats(answers: PlayerAnswer[]): RunStats {
  let bestStreak = 0
  let currentStreak = 0
  let nonLatinCorrect = 0

  const familyMap = new Map<string, { correct: number; total: number }>()

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId)
    const language = question?.correct ?? answer.correct
    const group = getLanguageGroup(language)

    if (answer.isCorrect) {
      currentStreak += 1
      bestStreak = Math.max(bestStreak, currentStreak)

      if (NON_LATIN_GROUPS.has(group)) {
        nonLatinCorrect += 1
      }
    } else {
      currentStreak = 0
    }

    if (!familyMap.has(group)) {
      familyMap.set(group, { correct: 0, total: 0 })
    }

    const family = familyMap.get(group)!
    family.total += 1
    if (answer.isCorrect) {
      family.correct += 1
    }
  }

  let bestFamily: FamilySummary | null = null

  for (const [key, value] of familyMap.entries()) {
    if (value.total === 0) continue

    const accuracy = value.correct / value.total
    const candidate: FamilySummary = {
      key,
      label: getFamilyLabel(key),
      correct: value.correct,
      total: value.total,
      accuracy,
    }

    if (
      !bestFamily ||
      candidate.accuracy > bestFamily.accuracy ||
      (candidate.accuracy === bestFamily.accuracy &&
        candidate.correct > bestFamily.correct)
    ) {
      bestFamily = candidate
    }
  }

  return {
    bestStreak,
    nonLatinCorrect,
    bestFamily,
  }
}