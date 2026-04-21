import { GameMode } from "@/lib/game-mode"
import { questions } from "@/lib/questions"
import { LANGUAGE_GROUPS, LANGUAGE_TO_GROUP } from "@/lib/language-groups"

const ALL_LANGUAGES: string[] = Array.from(
  new Set(questions.map((q) => q.correct))
)

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

function unique(array: string[]) {
  return Array.from(new Set(array))
}

export function getSmartOptions(
  correctLanguage: string,
  questionId: number,
  mode: GameMode
): string[] {
  const group = LANGUAGE_TO_GROUP[correctLanguage]

  const sameGroup: string[] = group
    ? LANGUAGE_GROUPS[group].filter((lang) => lang !== correctLanguage)
    : []

  const outsideGroup: string[] = ALL_LANGUAGES.filter(
    (lang) => lang !== correctLanguage && !sameGroup.includes(lang)
  )

  let distractors: string[] = []

  if (mode === "similar") {
    distractors = seededShuffle(sameGroup, questionId + 1000).slice(0, 3)
  } else if (mode === "hard") {
    const hardPool = unique([
      ...seededShuffle(sameGroup, questionId + 2000).slice(0, 2),
      ...seededShuffle(outsideGroup, questionId + 3000).slice(0, 3),
    ])

    distractors = hardPool.slice(0, 3)

    if (distractors.length < 3) {
      distractors = unique([
        ...distractors,
        ...seededShuffle(outsideGroup, questionId + 4000),
      ]).slice(0, 3)
    }
  } else {
    const normalPool = unique([
      ...seededShuffle(sameGroup, questionId + 5000).slice(0, 1),
      ...seededShuffle(outsideGroup, questionId + 6000).slice(0, 4),
    ])

    distractors = normalPool.slice(0, 3)

    if (distractors.length < 3) {
      distractors = unique([
        ...distractors,
        ...seededShuffle(outsideGroup, questionId + 7000),
      ]).slice(0, 3)
    }
  }

  return seededShuffle(
    unique([correctLanguage, ...distractors]).slice(0, 4),
    questionId + mode.length * 111
  )
}