import {
  MAY_2026_DAILY_WORDS,
  type AppLocale,
  type DailyFamily,
  type DailyLanguageCode,
  type DailyScript,
  type DailyTranslation,
  type DailyWord,
} from "@/lib/daily-words";

export type DailyQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

export type DailyCuriosity = {
  it: string;
  en: string;
};

export type DailyGame = {
  key: string;
  word: DailyWord;
  questions: DailyQuestion[];
  curiosity: DailyCuriosity;
};

const languageLabels: Record<AppLocale, Record<DailyLanguageCode, string>> = {
  it: {
    it: "italiano",
    en: "inglese",
    es: "spagnolo",
    fr: "francese",
    de: "tedesco",
    ru: "russo",
    ja: "giapponese",
  },
  en: {
    it: "Italian",
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    ru: "Russian",
    ja: "Japanese",
  },
};

const familyLabels: Record<AppLocale, Record<DailyFamily, string>> = {
  it: {
    romance: "romanza",
    germanic: "germanica",
    slavic: "slava",
    japanese: "giapponese",
  },
  en: {
    romance: "Romance",
    germanic: "Germanic",
    slavic: "Slavic",
    japanese: "Japanese",
  },
};

const scriptLabels: Record<AppLocale, Record<DailyScript, string>> = {
  it: {
    latin: "alfabeto latino",
    cyrillic: "alfabeto cirillico",
    japanese: "caratteri giapponesi",
  },
  en: {
    latin: "Latin alphabet",
    cyrillic: "Cyrillic alphabet",
    japanese: "Japanese characters",
  },
};

const languageCuriosities: DailyCuriosity[] = [
  {
    it: "Molte lingue non traducono solo parole: traducono modi diversi di vedere il mondo. Per questo due termini possono sembrare equivalenti, ma portare sfumature molto diverse.",
    en: "Languages do not only translate words: they translate different ways of seeing the world. That is why two words can look equivalent but carry different shades of meaning.",
  },
  {
    it: "Gli alfabeti non sono semplici decorazioni grafiche: cambiano il modo in cui riconosciamo una parola, anche quando il suono è più vicino di quanto sembri.",
    en: "Writing systems are not just visual decoration: they change how we recognize a word, even when the sound is closer than it looks.",
  },
  {
    it: "Le lingue della stessa famiglia spesso condividono radici invisibili. A volte la somiglianza è evidente, altre volte è nascosta da secoli di cambiamenti.",
    en: "Languages from the same family often share hidden roots. Sometimes the similarity is obvious, sometimes it is buried under centuries of change.",
  },
  {
    it: "Una parola presa in prestito da un’altra lingua può cambiare pronuncia, scrittura e perfino significato. Le lingue copiano, adattano e poi fingono che fosse tutto previsto.",
    en: "A borrowed word can change pronunciation, spelling, and even meaning. Languages copy, adapt, and then pretend it was planned all along.",
  },
  {
    it: "Le parole più comuni sono spesso le più antiche e resistenti. Proprio per questo sono utilissime per riconoscere parentele tra lingue diverse.",
    en: "The most common words are often the oldest and most resistant. That makes them especially useful for spotting relationships between languages.",
  },
  {
    it: "La somiglianza grafica può ingannare: due parole possono sembrare parenti senza esserlo davvero. Le lingue, come gli esseri umani, mentono benissimo con la faccia giusta.",
    en: "Visual similarity can be misleading: two words may look related without actually being related. Languages, like humans, can lie convincingly.",
  },
  {
    it: "Una lingua non è mai ferma. Cambia con migrazioni, commercio, tecnologia, musica, cinema e perfino meme. Sì, anche i meme fanno danni storici.",
    en: "A language never stands still. It changes through migration, trade, technology, music, cinema, and even memes. Yes, memes are historical agents now.",
  },
  {
    it: "Alcune lingue usano lo stesso alfabeto, ma organizzano suoni e parole in modi molto diversi. L’alfabeto è solo la porta d’ingresso, non tutta la casa.",
    en: "Some languages use the same alphabet but organize sounds and words very differently. The alphabet is only the entrance, not the whole house.",
  },
];

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function getLocalDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function hashString(input: string) {
  let hash = 0;

  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function rotate<T>(items: T[], seed: string) {
  if (items.length === 0) return items;

  const offset = hashString(seed) % items.length;

  return [...items.slice(offset), ...items.slice(0, offset)];
}

function optionSet(correct: string, wrong: string[], seed: string) {
  const values = Array.from(
    new Set([correct, ...wrong.filter((item) => item !== correct)]),
  );

  return rotate(values.slice(0, 4), seed);
}

function uniqueByValue(translations: DailyTranslation[]) {
  const counts = new Map<string, number>();

  for (const item of translations) {
    const key = item.value.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return translations.filter(
    (item) => counts.get(item.value.toLowerCase()) === 1,
  );
}

function getWordForKey(key: string) {
  const exact = MAY_2026_DAILY_WORDS.find((word) => word.dateKey === key);

  if (exact) return exact;

  const index = hashString(key) % MAY_2026_DAILY_WORDS.length;

  return MAY_2026_DAILY_WORDS[index];
}

function getNeighborWords(word: DailyWord) {
  const currentIndex = MAY_2026_DAILY_WORDS.findIndex(
    (item) => item.id === word.id,
  );

  const words: DailyWord[] = [];

  for (let i = 1; words.length < 8; i += 1) {
    const next =
      MAY_2026_DAILY_WORDS[(currentIndex + i) % MAY_2026_DAILY_WORDS.length];

    if (next && next.id !== word.id) {
      words.push(next);
    }
  }

  return words;
}

function translationFor(word: DailyWord, language: DailyLanguageCode) {
  const translation = word.translations.find(
    (item) => item.language === language,
  );

  if (!translation) {
    throw new Error(`Missing translation ${language} for ${word.lemmaIt}`);
  }

  return translation;
}

function buildTranslationQuestion(
  word: DailyWord,
  key: string,
  locale: AppLocale,
): DailyQuestion {
  const languages: DailyLanguageCode[] = ["en", "es", "fr", "de", "ru", "ja"];
  const language =
    languages[hashString(`${key}-translation`) % languages.length];
  const correct = translationFor(word, language);
  const neighbors = getNeighborWords(word);
  const wrong = neighbors.map((item) => translationFor(item, language).value);

  return {
    id: `${key}-translation`,
    prompt:
      locale === "en"
        ? `How do you say “${word.lemmaEn}” in ${languageLabels.en[language]}?`
        : `Come si dice “${word.lemmaIt}” in ${languageLabels.it[language]}?`,
    options: optionSet(correct.value, wrong, `${key}-translation-options`),
    correctAnswer: correct.value,
    explanation:
      locale === "en"
        ? `Correct answer: “${correct.value}”.`
        : `Risposta corretta: “${correct.value}”.`,
  };
}

function buildLanguageQuestion(
  word: DailyWord,
  key: string,
  locale: AppLocale,
): DailyQuestion {
  const unique = uniqueByValue(word.translations);
  const correct = unique[hashString(`${key}-language`) % unique.length];

  return {
    id: `${key}-language`,
    prompt:
      locale === "en"
        ? `Which language uses “${correct.value}”?`
        : `In quale lingua si dice “${correct.value}”?`,
    options: optionSet(
      languageLabels[locale][correct.language],
      word.translations
        .filter((item) => item.language !== correct.language)
        .map((item) => languageLabels[locale][item.language]),
      `${key}-language-options`,
    ),
    correctAnswer: languageLabels[locale][correct.language],
    explanation:
      locale === "en"
        ? `“${correct.value}” is ${languageLabels.en[correct.language]}.`
        : `“${correct.value}” è ${languageLabels.it[correct.language]}.`,
  };
}

function buildFamilyQuestion(
  word: DailyWord,
  key: string,
  locale: AppLocale,
): DailyQuestion {
  const translation =
    word.translations[hashString(`${key}-family`) % word.translations.length];

  return {
    id: `${key}-family`,
    prompt:
      locale === "en"
        ? `Which language family does ${languageLabels.en[translation.language]} belong to?`
        : `A quale famiglia linguistica appartiene il ${languageLabels.it[translation.language]}?`,
    options: rotate(
      [
        familyLabels[locale].romance,
        familyLabels[locale].germanic,
        familyLabels[locale].slavic,
        familyLabels[locale].japanese,
      ],
      `${key}-family-options`,
    ),
    correctAnswer: familyLabels[locale][translation.family],
    explanation:
      locale === "en"
        ? `${languageLabels.en[translation.language]} belongs to the ${familyLabels.en[translation.family]} family.`
        : `Il ${languageLabels.it[translation.language]} appartiene alla famiglia ${familyLabels.it[translation.family]}.`,
  };
}

function buildScriptQuestion(
  word: DailyWord,
  key: string,
  locale: AppLocale,
): DailyQuestion {
  const candidates = word.translations.filter(
    (item) => item.script !== "latin",
  );
  const translation =
    candidates[hashString(`${key}-script`) % candidates.length] ??
    word.translations[0];

  return {
    id: `${key}-script`,
    prompt:
      locale === "en"
        ? `Which writing system is used in “${translation.value}”?`
        : `Quale sistema di scrittura viene usato in “${translation.value}”?`,
    options: rotate(
      [
        scriptLabels[locale].latin,
        scriptLabels[locale].cyrillic,
        scriptLabels[locale].japanese,
      ],
      `${key}-script-options`,
    ),
    correctAnswer: scriptLabels[locale][translation.script],
    explanation:
      locale === "en"
        ? `“${translation.value}” uses ${scriptLabels.en[translation.script]}.`
        : `“${translation.value}” usa ${scriptLabels.it[translation.script]}.`,
  };
}

function buildMeaningQuestion(
  word: DailyWord,
  key: string,
  locale: AppLocale,
): DailyQuestion {
  const hardCandidates = word.translations.filter(
    (item) => item.language !== "it" && item.language !== "en",
  );

  const translation =
    hardCandidates[hashString(`${key}-meaning`) % hardCandidates.length];

  const sameCategoryWords = MAY_2026_DAILY_WORDS.filter(
    (item) => item.category === word.category && item.id !== word.id,
  );

  const fallbackWords = getNeighborWords(word);

  const wrongSource =
    sameCategoryWords.length >= 3 ? sameCategoryWords : fallbackWords;

  const wrong = wrongSource.map((item) =>
    locale === "en" ? item.lemmaEn : item.lemmaIt,
  );

  return {
    id: `${key}-meaning`,
    prompt:
      locale === "en"
        ? `What does “${translation.value}” mean?`
        : `Che cosa significa “${translation.value}”?`,
    options: optionSet(
      locale === "en" ? word.lemmaEn : word.lemmaIt,
      wrong,
      `${key}-meaning-options`,
    ),
    correctAnswer: locale === "en" ? word.lemmaEn : word.lemmaIt,
    explanation:
      locale === "en"
        ? `It means “${word.lemmaEn}”. The word was shown in ${languageLabels.en[translation.language]}.`
        : `Significa “${word.lemmaIt}”. La parola era mostrata in ${languageLabels.it[translation.language]}.`,
  };
}

export function getDailyGame(
  locale: AppLocale,
  dateOrKey: Date | string = new Date(),
): DailyGame {
  const key =
    typeof dateOrKey === "string" && isDateKey(dateOrKey)
      ? dateOrKey
      : getLocalDateKey(dateOrKey instanceof Date ? dateOrKey : new Date());

  const word = getWordForKey(key);

  const questionPool = [
    buildLanguageQuestion(word, key, locale),
    buildFamilyQuestion(word, key, locale),
    buildMeaningQuestion(word, key, locale),
  ];

  const question =
    questionPool[hashString(`${key}-single-question`) % questionPool.length];
  const curiosity =
    languageCuriosities[
      hashString(`${key}-curiosity`) % languageCuriosities.length
    ];

  return {
    key,
    word,
    questions: [question],
    curiosity,
  };
}
