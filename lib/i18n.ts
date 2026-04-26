export type AppLocale = "it" | "en"

type Messages = Record<string, string>

const it: Messages = {
  "home.tagline": "Riconosci la lingua. Batti i tuoi amici.",
  "home.name": "Il tuo nome",
  "home.namePlaceholder": "Scrivilo qui",
  "home.mode": "Modalità",
  "home.start": "Inizia",
  "home.ranked": "Ranked",
  "home.rankedBadge": "Top 50 globale",
  "home.rankedHint": "15 domande difficili · 10 secondi · season periodiche",

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

  "ranked.title": "ranked",
  "ranked.heading": "Classifica globale",
  "ranked.subtitle": "15 domande difficili. 10 secondi per risposta. Top 50 mondiale.",
  "ranked.currentSeason": "Season attuale",
  "ranked.endsIn": "Termina tra",
  "ranked.nickname": "Nickname ranked",
  "ranked.country": "Paese",
  "ranked.play": "Gioca ranked",
  "ranked.top10": "Top 10 attuale",
  "ranked.empty": "Nessuna entry ancora. Potresti essere il primo.",
  "ranked.score": "Punti",
  "ranked.time": "Tempo",
  "ranked.position": "Pos",
  "ranked.loading": "Caricamento ranked...",
  "ranked.cooldownActive": "Cooldown attivo",
  "ranked.cooldownText": "Puoi riprovare tra",
  "ranked.viewLeaderboard": "Vedi leaderboard",
  "ranked.disclaimerTitle": "Prima di entrare in Ranked",
  "ranked.disclaimerText":
    "Ti chiediamo onestà e massima collaborazione per mantenere Linguo una piattaforma pulita, rispettosa e libera da odio, razzismo e discriminazione.",
  "ranked.disclaimerCheck": "Ho capito e mi assumo ogni responsabilità",
  "ranked.disclaimerContinue": "Continua",
  "ranked.disclaimerCancel": "Annulla",
}

const en: Messages = {
  "home.tagline": "Recognize the language. Beat your friends.",
  "home.name": "Your name",
  "home.namePlaceholder": "Type it here",
  "home.mode": "Mode",
  "home.start": "Start",
  "home.ranked": "Ranked",
  "home.rankedBadge": "Global Top 50",
  "home.rankedHint": "15 hard questions · 10 seconds · periodic seasons",

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
  "common.createChallenge": "Creating chall enge...",
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

  "ranked.title": "ranked",
  "ranked.heading": "Global leaderboard",
  "ranked.subtitle": "15 hard questions. 10 seconds per answer. Global top 50.",
  "ranked.currentSeason": "Current season",
  "ranked.endsIn": "Ends in",
  "ranked.nickname": "Ranked nickname",
  "ranked.country": "Country",
  "ranked.play": "Play ranked",
  "ranked.top10": "Current top 10",
  "ranked.empty": "No entries yet. You could be the first.",
  "ranked.score": "Score",
  "ranked.time": "Time",
  "ranked.position": "Pos",
  "ranked.loading": "Loading ranked...",
  "ranked.cooldownActive": "Cooldown active",
  "ranked.cooldownText": "You can try again in",
  "ranked.viewLeaderboard": "View leaderboard",
  "ranked.disclaimerTitle": "Before entering Ranked",
  "ranked.disclaimerText":
    "We ask for honesty and full cooperation to keep Linguo a clean, respectful platform free from hate, racism, and discrimination.",
  "ranked.disclaimerCheck": "I understand and accept full responsibility",
  "ranked.disclaimerContinue": "Continue",
  "ranked.disclaimerCancel": "Cancel",
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