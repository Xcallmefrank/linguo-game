import { Question, questions } from "@/lib/questions"

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

export function getQuestionsForMode(mode: GameMode, count = 10): Question[] {
  if (mode === "hard") {
    return shuffleArray(
      questions.filter((q) => HARD_QUESTION_IDS.includes(q.id))
    ).slice(0, count)
  }

  if (mode === "similar") {
    return shuffleArray(
      questions.filter((q) => SIMILAR_QUESTION_IDS.includes(q.id))
    ).slice(0, count)
  }

  return shuffleArray(questions).slice(0, count)
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