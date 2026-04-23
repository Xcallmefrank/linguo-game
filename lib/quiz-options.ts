import { GameMode } from "@/lib/game-mode"
import { questions } from "@/lib/questions"
import { LANGUAGE_GROUPS, LANGUAGE_TO_GROUP } from "@/lib/language-groups"

const ALL_LANGUAGES: string[] = Array.from(
  new Set(questions.map((q) => q.correct))
)

function unique(array: string[]) {
  return Array.from(new Set(array))
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

export function getSmartOptions(
  correctLanguage: string,
  _questionId: number,
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
    distractors = shuffleArray(sameGroup).slice(0, 3)
  } else if (mode === "hard") {
    const hardPool = unique([
      ...shuffleArray(sameGroup).slice(0, 2),
      ...shuffleArray(outsideGroup).slice(0, 4),
    ])

    distractors = hardPool.slice(0, 3)

    if (distractors.length < 3) {
      distractors = unique([
        ...distractors,
        ...shuffleArray(outsideGroup),
      ]).slice(0, 3)
    }
  } else {
    const normalPool = unique([
      ...shuffleArray(sameGroup).slice(0, 1),
      ...shuffleArray(outsideGroup).slice(0, 5),
    ])

    distractors = normalPool.slice(0, 3)

    if (distractors.length < 3) {
      distractors = unique([
        ...distractors,
        ...shuffleArray(outsideGroup),
      ]).slice(0, 3)
    }
  }

  return shuffleArray(unique([correctLanguage, ...distractors]).slice(0, 4))
}