export const LANGUAGE_GROUPS: Record<string, string[]> = {
  romance: ["Italiano", "Francese", "Spagnolo", "Portoghese", "Rumeno"],
  germanic: ["Tedesco", "Olandese", "Danese", "Svedese", "Norvegese"],
  slavic: ["Russo", "Ucraino", "Bulgaro", "Serbo", "Polacco", "Ceco"],
  hellenic: ["Greco"],
  middleEastern: ["Arabo", "Persiano", "Urdu", "Turco"],
  eastAsian: ["Giapponese", "Coreano", "Cinese", "Thailandese", "Vietnamita"],
}

export const LANGUAGE_TO_GROUP: Record<string, string> = {}

for (const [groupName, langs] of Object.entries(LANGUAGE_GROUPS)) {
  for (const lang of langs) {
    LANGUAGE_TO_GROUP[lang] = groupName
  }
}

export function getLanguageGroup(language: string) {
  return LANGUAGE_TO_GROUP[language] ?? "other"
}