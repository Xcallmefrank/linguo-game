import type { AppLocale } from "@/lib/i18n"

const languageLabels: Record<string, { it: string; en: string }> = {
  Italiano: { it: "Italiano", en: "Italian" },
  Francese: { it: "Francese", en: "French" },
  Spagnolo: { it: "Spagnolo", en: "Spanish" },
  Portoghese: { it: "Portoghese", en: "Portuguese" },
  Rumeno: { it: "Rumeno", en: "Romanian" },

  Tedesco: { it: "Tedesco", en: "German" },
  Olandese: { it: "Olandese", en: "Dutch" },
  Danese: { it: "Danese", en: "Danish" },
  Svedese: { it: "Svedese", en: "Swedish" },
  Norvegese: { it: "Norvegese", en: "Norwegian" },

  Russo: { it: "Russo", en: "Russian" },
  Ucraino: { it: "Ucraino", en: "Ukrainian" },
  Bulgaro: { it: "Bulgaro", en: "Bulgarian" },
  Serbo: { it: "Serbo", en: "Serbian" },
  Polacco: { it: "Polacco", en: "Polish" },
  Ceco: { it: "Ceco", en: "Czech" },

  Arabo: { it: "Arabo", en: "Arabic" },
  Persiano: { it: "Persiano", en: "Persian" },
  Urdu: { it: "Urdu", en: "Urdu" },
  Turco: { it: "Turco", en: "Turkish" },

  Giapponese: { it: "Giapponese", en: "Japanese" },
  Coreano: { it: "Coreano", en: "Korean" },
  Cinese: { it: "Cinese", en: "Chinese" },
  Thailandese: { it: "Thailandese", en: "Thai" },
  Vietnamita: { it: "Vietnamita", en: "Vietnamese" },
}

export function getLanguageLabel(language: string, locale: AppLocale): string {
  return languageLabels[language]?.[locale] ?? language
}