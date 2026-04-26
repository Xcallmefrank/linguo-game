export type AppLocale = "it" | "en"

type Messages = Record<string, string>

const it: Messages = {
  "home.tagline": "Riconosci la lingua. Batti i tuoi amici.",
  "home.name": "Il tuo nome",
  "home.namePlaceholder": "Scrivilo qui",
  "home.mode": "Modalità",
  "home.start": "Inizia",
  "home.ranked": "Ranked",
  "home.rankedBadge": "Top 25 globale",
  "home.rankedHint": "3 run da 10 domande · season da 3 giorni",
  "home.login": "Accedi con Google",
  "home.loginHint": "Accedi e salva i tuoi progressi",
  "home.profile": "Profilo",
  "home.logout": "Logout",
  "home.activePlayer": "Giocatore attivo",
  "home.globalChallenge": "Sfida globale",

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
  "common.checking": "Controllo...",
  "common.save": "Salva",
  "common.saving": "Salvo...",
  "common.continue": "Continua",
  "common.cancel": "Annulla",

  "quiz.score": "Punteggio",
  "quiz.question": "domanda",
  "quiz.timer": "Timer",

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
  "toast.consentUnavailable":
    "Le impostazioni di consenso non sono ancora disponibili.",
  "toast.rankedLoadError": "Non sono riuscito a caricare la ranked.",
  "toast.rankedRunLoadError":
    "Non sono riuscito a caricare la run ranked.",
  "toast.profileCreateError":
    "Non sono riuscito a creare il profilo.",
  "toast.profileCreated": "Profilo creato.",
  "toast.nicknameTaken": "Questo nickname è già usato.",
  "toast.nicknameCheckError":
    "Non sono riuscito a verificare il nickname.",
  "toast.rankedRunSubmitError":
    "Non sono riuscito a inviare la tua run ranked.",

  "auth.title": "accesso",
  "auth.finishing": "Sto completando il login...",
  "auth.checkingSession": "Controllo sessione...",
  "auth.checkingAccess": "Controllo accesso...",
  "auth.goingToGoogle": "Ti porto al login Google...",

  "profile.title": "profilo",
  "profile.completeTitle": "Completa il tuo profilo",
  "profile.completeSubtitle":
    "Scegli un nickname unico e il tuo paese.",
  "profile.nickname": "Nickname",
  "profile.country": "Paese",
  "profile.create": "Crea profilo",
  "profile.loading": "Carico statistiche e grafici...",
  "profile.currentSeason": "Season attuale",
  "profile.runsCompleted": "Run completate",
  "profile.averageScore": "Media score",
  "profile.averageAccuracy": "Accuracy media",
  "profile.averageTime": "Tempo medio",
  "profile.bestScore": "Best score",
  "profile.bestStreak": "Best streak",
  "profile.totalGames": "Partite totali",
  "profile.rankedStatus": "Stato classifica",
  "profile.officialAvailable": "Classifica ufficiale disponibile",
  "profile.completeThreeRuns":
    "Completa tutte e 3 le run per entrare nella classifica ufficiale.",
  "profile.goRanked": "Vai alla ranked",
  "profile.gamesByMode": "Partite per modalità",
  "profile.avgAccuracyByMode": "Accuracy media per modalità",
  "profile.modeStats": "Statistiche per modalità",
  "profile.recentGames": "Ultime partite",
  "profile.noGamesYet": "Nessuna partita salvata ancora.",
  "profile.noChartData": "Nessun dato disponibile ancora.",

  "nickname.tooShort": "Il nickname deve avere almeno 3 caratteri.",
  "nickname.tooLong": "Il nickname può avere massimo 14 caratteri.",
  "nickname.invalidChars":
    "Usa solo lettere, numeri, spazi e i simboli base.",
  "nickname.notAllowed":
    "Questo nickname non è consentito. Scegline uno rispettoso.",

  "ranked.title": "ranked",
  "ranked.heading": "Classifica globale",
  "ranked.subtitle":
    "3 run da 10 domande. Entri in classifica solo dopo 3/3.",
  "ranked.currentSeason": "Season attuale",
  "ranked.endsIn": "Termina tra",
  "ranked.nickname": "Nickname ranked",
  "ranked.country": "Paese",
  "ranked.play": "Gioca ranked",
  "ranked.empty": "Nessuna classifica ufficiale ancora disponibile.",
  "ranked.score": "Punti",
  "ranked.time": "Tempo",
  "ranked.position": "Pos",
  "ranked.loading": "Caricamento ranked...",
  "ranked.cooldownActive": "Cooldown attivo",
  "ranked.cooldownText": "Puoi riprovare tra",
  "ranked.viewLeaderboard": "Vedi leaderboard",
  "ranked.topOfficial": "Top 25 ufficiale",
  "ranked.topOfficialHint": "Solo utenti con 3/3 run completate",
  "ranked.player": "Giocatore",
  "ranked.state": "Stato",
  "ranked.provisionalAverage": "Media provvisoria",
  "ranked.officialLeaderboard": "Classifica ufficiale",
  "ranked.accessLeaderboard": "Accesso classifica",
  "ranked.officialPosition": "Posizione ufficiale",
  "ranked.playRun": "Gioca run",
  "ranked.allRunsCompleted": "Tutte le run completate",
  "ranked.runCompleted": "Run completata",
  "ranked.runAccuracy": "Accuracy run",
  "ranked.runTime": "Tempo run",
  "ranked.seasonStatus": "Stato season",
  "ranked.disclaimerTitle": "Prima di entrare in Ranked",
  "ranked.disclaimerText":
    "Ti chiediamo onestà e massima collaborazione per mantenere Linguo una piattaforma pulita, rispettosa e libera da odio, razzismo e discriminazione.",
  "ranked.disclaimerCheck": "Ho capito e mi assumo ogni responsabilità",
  "ranked.disclaimerContinue": "Continua",
  "ranked.disclaimerCancel": "Annulla",
  "ranked.checkingProfile": "Controllo profilo...",
  "ranked.loadingSeason": "Carico la season...",
  "ranked.loadingRun": "Preparo la run...",
  "ranked.problemLoading": "C'è stato un problema nel caricamento.",
  "ranked.noQuestions": "Nessuna domanda ranked disponibile.",

  "ranked.runMessage.veryBad": "Run brutale.",
  "ranked.runMessage.bad": "Non gloriosa, ma sopravvissuta.",
  "ranked.runMessage.ok": "Buona run. La season però osserva.",
  "ranked.runMessage.good": "Run forte. Stai costruendo bene.",
  "ranked.runMessage.great":
    "Ottima run. Serve solo un altro colpo pulito.",
  "ranked.runMessage.perfect": "Run perfetta. Fastidiosamente bella.",
  
}

const en: Messages = {
  "home.tagline": "Recognize the language. Beat your friends.",
  "home.name": "Your name",
  "home.namePlaceholder": "Type it here",
  "home.mode": "Mode",
  "home.start": "Start",
  "home.ranked": "Ranked",
  "home.rankedBadge": "Global Top 25",
  "home.rankedHint": "3 runs of 10 questions · 3-day seasons",
  "home.login": "Sign in with Google",
  "home.loginHint": "Sign in and save your progress",
  "home.profile": "Profile",
  "home.logout": "Logout",
  "home.activePlayer": "Active player",
  "home.globalChallenge": "Global challenge",

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
  "common.checking": "Checking...",
  "common.save": "Save",
  "common.saving": "Saving...",
  "common.continue": "Continue",
  "common.cancel": "Cancel",

  "quiz.score": "Score",
  "quiz.question": "question",
  "quiz.timer": "Timer",

  "result.title": "result",
  "result.bestStreak": "Best streak",
  "result.nonLatin": "Non-Latin",
  "result.bestFamily": "Best family",
  "result.noData": "No useful data yet.",

  "compare.title": "comparison",
  "compare.activeChallenge": "active challenge",
  "compare.waiting": "Waiting for someone to complete the challenge.",
  "compare.noOpponent": "No opponent yet.",
  "compare.autoRefresh":
    "This page refreshes automatically every few seconds.",
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
  "toast.consentUnavailable":
    "Consent settings are not available yet.",
  "toast.rankedLoadError": "I couldn't load ranked mode.",
  "toast.rankedRunLoadError": "I couldn't load the ranked run.",
  "toast.profileCreateError": "I couldn't create the profile.",
  "toast.profileCreated": "Profile created.",
  "toast.nicknameTaken": "This nickname is already in use.",
  "toast.nicknameCheckError": "I couldn't verify the nickname.",
  "toast.rankedRunSubmitError":
    "I couldn't submit your ranked run.",

  "auth.title": "access",
  "auth.finishing": "Finishing your login...",
  "auth.checkingSession": "Checking session...",
  "auth.checkingAccess": "Checking access...",
  "auth.goingToGoogle": "Taking you to Google sign-in...",

  "profile.title": "profile",
  "profile.completeTitle": "Complete your profile",
  "profile.completeSubtitle":
    "Choose a unique nickname and your country.",
  "profile.nickname": "Nickname",
  "profile.country": "Country",
  "profile.create": "Create profile",
  "profile.loading": "Loading stats and charts...",
  "profile.currentSeason": "Current season",
  "profile.runsCompleted": "Runs completed",
  "profile.averageScore": "Average score",
  "profile.averageAccuracy": "Average accuracy",
  "profile.averageTime": "Average time",
  "profile.bestScore": "Best score",
  "profile.bestStreak": "Best streak",
  "profile.totalGames": "Total games",
  "profile.rankedStatus": "Leaderboard status",
  "profile.officialAvailable": "Official leaderboard available",
  "profile.completeThreeRuns":
    "Complete all 3 runs to enter the official leaderboard.",
  "profile.goRanked": "Go to ranked",
  "profile.gamesByMode": "Games by mode",
  "profile.avgAccuracyByMode": "Average accuracy by mode",
  "profile.modeStats": "Mode statistics",
  "profile.recentGames": "Recent games",
  "profile.noGamesYet": "No saved games yet.",
  "profile.noChartData": "No data available yet.",

  "nickname.tooShort": "Nickname must be at least 3 characters long.",
  "nickname.tooLong": "Nickname can be at most 14 characters long.",
  "nickname.invalidChars":
    "Use letters, numbers, spaces and basic symbols only.",
  "nickname.notAllowed":
    "This nickname is not allowed. Choose a respectful one.",

  "ranked.title": "ranked",
  "ranked.heading": "Global leaderboard",
  "ranked.subtitle":
    "3 runs of 10 questions. You enter the leaderboard only after 3/3.",
  "ranked.currentSeason": "Current season",
  "ranked.endsIn": "Ends in",
  "ranked.nickname": "Ranked nickname",
  "ranked.country": "Country",
  "ranked.play": "Play ranked",
  "ranked.empty": "No official leaderboard available yet.",
  "ranked.score": "Score",
  "ranked.time": "Time",
  "ranked.position": "Pos",
  "ranked.loading": "Loading ranked...",
  "ranked.cooldownActive": "Cooldown active",
  "ranked.cooldownText": "You can try again in",
  "ranked.viewLeaderboard": "View leaderboard",
  "ranked.topOfficial": "Official top 25",
  "ranked.topOfficialHint": "Only users with 3/3 completed runs",
  "ranked.player": "Player",
  "ranked.state": "State",
  "ranked.provisionalAverage": "Provisional average",
  "ranked.officialLeaderboard": "Official leaderboard",
  "ranked.accessLeaderboard": "Leaderboard access",
  "ranked.officialPosition": "Official position",
  "ranked.playRun": "Play run",
  "ranked.allRunsCompleted": "All runs completed",
  "ranked.runCompleted": "Run completed",
  "ranked.runAccuracy": "Run accuracy",
  "ranked.runTime": "Run time",
  "ranked.seasonStatus": "Season status",
  "ranked.disclaimerTitle": "Before entering Ranked",
  "ranked.disclaimerText":
    "We ask for honesty and full cooperation to keep Linguo a clean, respectful platform free from hate, racism, and discrimination.",
  "ranked.disclaimerCheck":
    "I understand and accept full responsibility",
  "ranked.disclaimerContinue": "Continue",
  "ranked.disclaimerCancel": "Cancel",
  "ranked.checkingProfile": "Checking profile...",
  "ranked.loadingSeason": "Loading season...",
  "ranked.loadingRun": "Preparing the run...",
  "ranked.problemLoading": "There was a problem while loading.",
  "ranked.noQuestions": "No ranked questions available.",

  "ranked.runMessage.veryBad": "That was brutal.",
  "ranked.runMessage.bad": "Not glorious, but survivable.",
  "ranked.runMessage.ok": "Decent run. The season keeps judging.",
  "ranked.runMessage.good": "Strong run. You're building something.",
  "ranked.runMessage.great": "Excellent. One more sharp push.",
  "ranked.runMessage.perfect":
    "Perfect run. Very annoying, in a good way.",

    
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