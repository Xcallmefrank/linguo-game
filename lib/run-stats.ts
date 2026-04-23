import { PlayerAnswer } from "@/lib/challenge";
import { questions } from "@/lib/questions";
import { getLanguageGroup } from "@/lib/language-groups";
import type { AppLocale } from "@/lib/i18n";

type FamilyKey =
  | "romance"
  | "germanic"
  | "slavic"
  | "middleEastern"
  | "eastAsian"
  | "other"
  | "hellenic";

type FamilySummary = {
  key: FamilyKey;
  correct: number;
  total: number;
  accuracy: number;
};

export type RunStats = {
  bestStreak: number;
  nonLatinCorrect: number;
  bestFamily: FamilySummary | null;
};

const NON_LATIN_GROUPS = new Set(["slavic", "middleEastern", "eastAsian"]);

export function getFamilyLabel(group: string, locale: AppLocale): string {
  const labels: Record<FamilyKey, { it: string; en: string }> = {
    romance: { it: "Romanze", en: "Romance" },
    germanic: { it: "Germaniche", en: "Germanic" },
    slavic: { it: "Slave", en: "Slavic" },
    middleEastern: { it: "Mediorientali", en: "Middle Eastern" },
    eastAsian: { it: "Asiatiche", en: "East Asian" },
    hellenic: { it: "Elleniche", en: "Hellenic" },
    other: { it: "Altre", en: "Other" },
  };

  const safeKey = (group in labels ? group : "other") as FamilyKey;
  return labels[safeKey][locale];
}

export function getRunStats(answers: PlayerAnswer[]): RunStats {
  let bestStreak = 0;
  let currentStreak = 0;
  let nonLatinCorrect = 0;

  const familyMap = new Map<FamilyKey, { correct: number; total: number }>();

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    const language = question?.correct ?? answer.correct;
    const rawGroup = getLanguageGroup(language);
    const group = (
      [
        "romance",
        "germanic",
        "slavic",
        "hellenic",
        "middleEastern",
        "eastAsian",
      ].includes(rawGroup)
        ? rawGroup
        : "other"
    ) as FamilyKey;

    if (answer.isCorrect) {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);

      if (NON_LATIN_GROUPS.has(group)) {
        nonLatinCorrect += 1;
      }
    } else {
      currentStreak = 0;
    }

    if (!familyMap.has(group)) {
      familyMap.set(group, { correct: 0, total: 0 });
    }

    const family = familyMap.get(group)!;
    family.total += 1;
    if (answer.isCorrect) {
      family.correct += 1;
    }
  }

  let bestFamily: FamilySummary | null = null;

  for (const [key, value] of familyMap.entries()) {
    if (value.total === 0) continue;

    const accuracy = value.correct / value.total;
    const candidate: FamilySummary = {
      key,
      correct: value.correct,
      total: value.total,
      accuracy,
    };

    if (
      !bestFamily ||
      candidate.accuracy > bestFamily.accuracy ||
      (candidate.accuracy === bestFamily.accuracy &&
        candidate.correct > bestFamily.correct)
    ) {
      bestFamily = candidate;
    }
  }

  return {
    bestStreak,
    nonLatinCorrect,
    bestFamily,
  };
}
