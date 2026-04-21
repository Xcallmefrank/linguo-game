export type AppLocale = "it" | "en"

type Messages = Record<string, string>

const it: Messages = {
  "home.tagline": "Riconosci la lingua. Batti i tuoi amici.",
  "home.name": "Il tuo nome",
  "home.namePlaceholder": "Scrivilo qui",
  "home.mode": "Modalità",
  "home.start": "Inizia",
  "mode.normal": "Normale",
  "mode.hard": "Difficile",
  "mode.similar": "Lingue simili",
  "mode.normal.desc": "Varietà bilanciata e ritmo pulito.",
  "mode.hard.desc": "Più ambiguità, meno pietà.",
  "mode.similar.desc": "Lingue vicine. Errori più umilianti.",
  "common.loading": "Caricamento...",
  "common.backHome": "Torna alla home",
  "common.playAgain": "Rigioca",
  "common.newGame": "Nuova partita",
  "common.downloadCard": "Scarica card",
  "common.prepareCard": "Preparo la card...",
  "common.shareChallenge": "Condividi challenge",
  "common.createChallenge": "Creo la challenge...",
  "common.challengeStatus": "Vedi stato sfida",
  "quiz.score": "Punteggio",
  "quiz.question": "domanda",
  "result.title": "risultato",
  "result.bestStreak": "Serie migliore",
  "result.nonLatin": "Non latine",
  "result.bestFamily": "Famiglia migliore",
  "result.noData": "Ancora nessun dato utile.",
  "compare.title": "confronto",
  "compare.activeChallenge": "challenge attiva",
  "compare.waiting": "In attesa che qualcuno completi la sfida.",
  "compare.noOpponent": "Nessun avversario ancora.",
  "compare.autoRefresh": "La pagina si aggiorna da sola ogni pochi secondi.",
  "compare.copyLink": "Copia link sfida",
  "compare.refreshNow": "Aggiorna ora",
  "compare.correctAnswer": "Risposta corretta",
  "compare.correct": "Corretta",
  "compare.wrong": "Errata",
  "challenge.title": "challenge",
  "challenge.canYouBeat": "Riuscirai a batterlo?",
  "challenge.accept": "Accetta la sfida",
  "privacy.title": "privacy",
  "privacy.heading": "Informativa essenziale",
  "privacy.back": "Torna indietro",
  "footer.privacy": "Privacy",
  "footer.consent": "Gestisci consenso",
  "footer.tagline": "Linguo · Riconosci la lingua. Batti i tuoi amici.",
  "toast.copyChallenge": "Challenge copiata negli appunti.",
  "toast.copyLink": "Link challenge copiato.",
  "toast.downloadError": "Non sono riuscito a scaricare la card.",
  "toast.copyError": "Non sono riuscito a copiare il link.",
  "toast.challengeCreateError": "Non sono riuscito a creare la challenge.",
  "toast.challengeSaveError": "Non sono riuscito a salvare il tentativo.",
  "toast.consentUnavailable": "Le impostazioni di consenso non sono ancora disponibili.",
}

const en: Messages = {
  "home.tagline": "Recognize the language. Beat your friends.",
  "home.name": "Your name",
  "home.namePlaceholder": "Type it here",
  "home.mode": "Mode",
  "home.start": "Start",
  "mode.normal": "Normal",
  "mode.hard": "Hard",
  "mode.similar": "Similar languages",
  "mode.normal.desc": "Balanced variety and clean rhythm.",
  "mode.hard.desc": "More ambiguity, less mercy.",
  "mode.similar.desc": "Close languages. More humiliating mistakes.",
  "common.loading": "Loading...",
  "common.backHome": "Back to home",
  "common.playAgain": "Play again",
  "common.newGame": "New game",
  "common.downloadCard": "Download card",
  "common.prepareCard": "Preparing card...",
  "common.shareChallenge": "Share challenge",
  "common.createChallenge": "Creating challenge...",
  "common.challengeStatus": "View challenge status",
  "quiz.score": "Score",
  "quiz.question": "question",
  "result.title": "result",
  "result.bestStreak": "Best streak",
  "result.nonLatin": "Non-Latin",
  "result.bestFamily": "Best family",
  "result.noData": "No useful data yet.",
  "compare.title": "comparison",
  "compare.activeChallenge": "active challenge",
  "compare.waiting": "Waiting for someone to complete the challenge.",
  "compare.noOpponent": "No opponent yet.",
  "compare.autoRefresh": "This page refreshes automatically every few seconds.",
  "compare.copyLink": "Copy challenge link",
  "compare.refreshNow": "Refresh now",
  "compare.correctAnswer": "Correct answer",
  "compare.correct": "Correct",
  "compare.wrong": "Wrong",
  "challenge.title": "challenge",
  "challenge.canYouBeat": "Can you beat them?",
  "challenge.accept": "Accept challenge",
  "privacy.title": "privacy",
  "privacy.heading": "Essential policy",
  "privacy.back": "Go back",
  "footer.privacy": "Privacy",
  "footer.consent": "Manage consent",
  "footer.tagline": "Linguo · Recognize the language. Beat your friends.",
  "toast.copyChallenge": "Challenge copied to clipboard.",
  "toast.copyLink": "Challenge link copied.",
  "toast.downloadError": "I couldn't download the card.",
  "toast.copyError": "I couldn't copy the link.",
  "toast.challengeCreateError": "I couldn't create the challenge.",
  "toast.challengeSaveError": "I couldn't save the attempt.",
  "toast.consentUnavailable": "Consent settings are not available yet.",
}

const dictionaries: Record<AppLocale, Messages> = { it, en }

export function detectBrowserLocale(): AppLocale {
  if (typeof window === "undefined") return "en"

  const saved = window.localStorage.getItem("linguo_locale")
  if (saved === "it" || saved === "en") return saved

  const lang = window.navigator.language.toLowerCase()
  if (lang.startsWith("it")) return "it"
  if (lang.startsWith("en")) return "en"

  return "en"
}

export function getMessages(locale: AppLocale): Messages {
  return dictionaries[locale] ?? dictionaries.en
}

export function t(locale: AppLocale, key: string): string {
  return dictionaries[locale]?.[key] ?? dictionaries.en?.[key] ?? key
}