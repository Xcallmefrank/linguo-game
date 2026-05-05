"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "motion/react"

import { Button } from "@/components/button"
import { Card } from "@/components/card"
import { useAuth } from "@/components/auth-provider"
import { useLocale } from "@/components/locale-provider"
import { useToast } from "@/components/toast-provider"

import { signInWithGoogle } from "@/lib/auth"
import { getMyProfile } from "@/lib/profile"
import { getDailyGame } from "@/lib/daily"
import { trackEvent } from "@/lib/analytics"
import {
  getMyDailyAttempt,
  saveDailyAttempt,
  type DailyAnswer,
  type DailyAttempt,
} from "@/lib/daily-sessions"

type GateState =
  | "checking-auth"
  | "signing-in"
  | "checking-profile"
  | "loading-daily"
  | "ready"
  | "error"

export default function DailyPlayPage() {
  return (
    <Suspense fallback={<DailyPlayFallback />}>
      <DailyPlayContent />
    </Suspense>
  )
}

function DailyPlayFallback() {
  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            Daily Word
          </p>

          <h1 className="mt-4 text-2xl font-semibold text-white">
            Preparo la domanda...
          </h1>

          <p className="mt-3 text-sm text-zinc-400">Caricamento...</p>
        </Card>
      </div>
    </main>
  )
}

function DailyPlayContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { user, loading: authLoading } = useAuth()
  const { locale } = useLocale()
  const { showToast } = useToast()

  const requestedDay = searchParams.get("day")
  const invitedBy = searchParams.get("from")

  const daily = useMemo(
    () => getDailyGame(locale, requestedDay ?? undefined),
    [locale, requestedDay]
  )

  const question = daily.questions[0]

  const [gateState, setGateState] = useState<GateState>("checking-auth")
  const [profileNickname, setProfileNickname] = useState("")
  const [attempt, setAttempt] = useState<DailyAttempt | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const answered = Boolean(selectedAnswer)
  const isCorrect = selectedAnswer === question?.correctAnswer

  useEffect(() => {
    let cancelled = false

    const loadDaily = async () => {
      try {
        if (authLoading) {
          setGateState("checking-auth")
          return
        }

        if (!user) {
          setGateState("signing-in")

          const currentDailyPath = `${window.location.pathname}${window.location.search}`

          window.localStorage.setItem("linguo_after_login", currentDailyPath)
          window.localStorage.setItem("linguo_after_profile", currentDailyPath)

          await signInWithGoogle()
          return
        }

        setGateState("checking-profile")

        const profile = await getMyProfile(user.id)

        if (cancelled) return

        if (!profile) {
          const currentDailyPath = `${window.location.pathname}${window.location.search}`

          window.localStorage.setItem("linguo_after_profile", currentDailyPath)
          router.replace("/complete-profile")
          return
        }

        setProfileNickname(profile.nickname)
        setGateState("loading-daily")

        const existingAttempt = await getMyDailyAttempt(user.id, daily.key)

        if (cancelled) return

        setAttempt(existingAttempt)
        setGateState("ready")
      } catch (error) {
        console.error("Errore caricamento daily play:", error)

        if (!cancelled) {
          setGateState("error")
        }
      }
    }

    void loadDaily()

    return () => {
      cancelled = true
    }
  }, [authLoading, user, router, daily.key])

  useEffect(() => {
    if (gateState !== "ready") return
    if (attempt) return

    trackEvent("daily_play_start", {
      daily_key: daily.key,
      invited: Boolean(invitedBy),
    })
  }, [gateState, attempt, daily.key, invitedBy])

  const handleSubmit = async () => {
    if (!user || !question || !selectedAnswer || submitting) return

    try {
      setSubmitting(true)

      const answers: DailyAnswer[] = [
        {
          questionId: question.id,
          prompt: question.prompt,
          selectedAnswer,
          correctAnswer: question.correctAnswer,
          correct: selectedAnswer === question.correctAnswer,
        },
      ]

      const score = answers[0].correct ? 1 : 0

      const saved = await saveDailyAttempt({
        userId: user.id,
        dailyKey: daily.key,
        wordId: daily.word.id,
        score,
        totalQuestions: 1,
        answers,
      })

      setAttempt(saved)

      trackEvent("daily_completed", {
        daily_key: daily.key,
        score,
        total_questions: 1,
        correct: score === 1,
      })

      showToast(
        locale === "en" ? "Daily saved." : "Daily salvata.",
        "success"
      )
    } catch (error) {
      console.error("Errore salvataggio daily:", error)

      try {
        const existing = user ? await getMyDailyAttempt(user.id, daily.key) : null

        if (existing) {
          setAttempt(existing)

          showToast(
            locale === "en"
              ? "You had already completed this daily."
              : "Avevi già completato questa daily.",
            "success"
          )

          return
        }
      } catch (innerError) {
        console.error("Errore recupero daily esistente:", innerError)
      }

      showToast(
        locale === "en"
          ? "I couldn't save the daily."
          : "Non sono riuscito a salvare la daily.",
        "error"
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleShareDaily = async () => {
    if (!attempt) return

    trackEvent("daily_shared", {
      source: "daily_play",
      daily_key: daily.key,
      score: attempt.score,
      total_questions: attempt.total_questions,
    })

    const origin = window.location.origin
    const from = encodeURIComponent(profileNickname || "Linguo")
    const shareUrl = `${origin}/daily?day=${daily.key}&from=${from}`

    const shareText =
      locale === "en"
        ? `${profileNickname || "Someone"} scored ${attempt.score}/${attempt.total_questions} on Linguo Daily Word. Can you solve it?`
        : `${profileNickname || "Qualcuno"} ha fatto ${attempt.score}/${attempt.total_questions} nella Daily Word di Linguo. Riesci a risolverla?`

    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)

      showToast(
        locale === "en" ? "Challenge link copied." : "Link sfida copiato.",
        "success"
      )
    } catch (error) {
      console.error("Errore copia daily:", error)
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Linguo Daily Word",
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        console.error("Condivisione daily annullata:", error)
      }
    }
  }

  if (authLoading || gateState !== "ready") {
    return (
      <main className="min-h-screen px-5 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Daily Word
            </p>

            <h1 className="mt-4 text-2xl font-semibold text-white">
              {locale === "en"
                ? "Preparing your question..."
                : "Preparo la domanda..."}
            </h1>

            <p className="mt-3 text-sm text-zinc-400">
              {gateState === "signing-in"
                ? locale === "en"
                  ? "Taking you to Google sign-in..."
                  : "Ti porto al login Google..."
                : gateState === "checking-profile"
                  ? locale === "en"
                    ? "Checking your profile..."
                    : "Controllo il profilo..."
                  : gateState === "error"
                    ? locale === "en"
                      ? "Something went wrong."
                      : "Qualcosa è andato storto."
                    : locale === "en"
                      ? "Loading..."
                      : "Caricamento..."}
            </p>

            {gateState === "error" ? (
              <Button
                onClick={() => router.push("/daily")}
                className="mt-6 h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
              >
                {locale === "en" ? "Back to map" : "Torna alla mappa"}
              </Button>
            ) : null}
          </Card>
        </div>
      </main>
    )
  }

  if (attempt) {
    return (
      <main className="min-h-screen px-5 py-10">
        <div className="mx-auto max-w-2xl">
          <TopBar
            onBack={() => router.push(`/daily?day=${daily.key}`)}
            locale={locale}
          />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="relative overflow-hidden rounded-[36px] border border-white/10 bg-black/40 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,197,94,0.14),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(250,204,21,0.09),transparent_30%)]" />

              <div className="relative space-y-6 text-center">
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                  {daily.key}
                </p>

                <div className="text-6xl">{daily.word.emoji}</div>

                <h1 className="text-3xl font-semibold text-white">
                  {locale === "en" ? "Daily completed" : "Daily completata"}
                </h1>

                <p className="text-zinc-400">
                  {profileNickname} · {attempt.score}/{attempt.total_questions}
                </p>

                <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-5 text-left">
                  <p className="text-xs uppercase tracking-[0.18em] text-green-300">
                    {locale === "en" ? "Revealed word" : "Parola rivelata"}
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {daily.word.lemmaIt} / {daily.word.lemmaEn}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    {daily.curiosity[locale]}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-left">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                    {locale === "en" ? "Question" : "Domanda"}
                  </p>

                  <p className="mt-2 text-sm text-zinc-300">
                    {attempt.answers[0]?.prompt}
                  </p>

                  <p
                    className={`mt-3 text-sm font-medium ${
                      attempt.score > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {attempt.score > 0
                      ? locale === "en"
                        ? "Correct"
                        : "Corretta"
                      : locale === "en"
                        ? "Wrong"
                        : "Errata"}
                    : {attempt.answers[0]?.selectedAnswer}
                  </p>

                  {attempt.score === 0 ? (
                    <p className="mt-1 text-sm text-zinc-400">
                      {locale === "en"
                        ? "Correct answer"
                        : "Risposta corretta"}
                      : {attempt.answers[0]?.correctAnswer}
                    </p>
                  ) : null}
                </div>

                <Button
                  onClick={handleShareDaily}
                  className="h-12 w-full rounded-2xl border border-green-500/30 bg-green-500/10 text-base font-medium text-green-300 transition-all duration-200 hover:bg-green-500/15"
                >
                  {locale === "en" ? "Challenge a friend" : "Sfida un amico"}
                </Button>

                <Button
                  onClick={() => router.push(`/daily?day=${daily.key}`)}
                  className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
                >
                  {locale === "en" ? "Back to map" : "Torna alla mappa"}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <TopBar
          onBack={() => router.push(`/daily?day=${daily.key}`)}
          locale={locale}
        />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="relative overflow-hidden rounded-[36px] border border-white/10 bg-black/40 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,197,94,0.14),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(250,204,21,0.09),transparent_30%)]" />

            <div className="relative space-y-6">
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                  {daily.key}
                </p>

                <div className="mt-4 text-6xl">{daily.word.emoji}</div>

                <h1 className="mt-4 text-3xl font-semibold text-white">
                  {locale === "en" ? "Mystery Word" : "Parola misteriosa"}
                </h1>

                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {invitedBy
                    ? locale === "en"
                      ? `${invitedBy} invited you to solve today’s Daily Word.`
                      : `${invitedBy} ti ha invitato a risolvere la Daily Word di oggi.`
                    : locale === "en"
                      ? "One hidden word. One question. One chance."
                      : "Una parola nascosta. Una domanda. Una possibilità."}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  {locale === "en" ? "Question" : "Domanda"}
                </p>

                <h2 className="mt-3 text-xl font-semibold leading-8 text-white">
                  {question.prompt}
                </h2>

                <div className="mt-5 grid gap-3">
                  {question.options.map((option) => {
                    const selected = selectedAnswer === option
                    const correct = option === question.correctAnswer

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSelectedAnswer(option)}
                        disabled={answered}
                        className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition-all ${
                          selected && correct
                            ? "border-green-500 bg-green-500/15 text-green-300"
                            : selected && !correct
                              ? "border-red-500 bg-red-500/15 text-red-300"
                              : answered && correct
                                ? "border-green-500/60 bg-green-500/10 text-green-300"
                                : "border-zinc-800 bg-zinc-950/70 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900"
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>

                {selectedAnswer ? (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4">
                    <p
                      className={`text-sm font-medium ${
                        isCorrect ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {isCorrect
                        ? locale === "en"
                          ? "Correct."
                          : "Corretto."
                        : locale === "en"
                          ? "Wrong."
                          : "Sbagliato."}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {question.explanation}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  {locale === "en"
                    ? "Language curiosity"
                    : "Curiosità linguistica"}
                </p>

                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {daily.curiosity[locale]}
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!selectedAnswer || submitting}
                className="h-12 w-full rounded-2xl bg-green-500 text-base font-semibold text-black transition-all duration-200 hover:bg-green-400 disabled:opacity-50"
              >
                {submitting
                  ? locale === "en"
                    ? "Saving..."
                    : "Salvo..."
                  : locale === "en"
                    ? "Complete Daily"
                    : "Completa Daily"}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}

function TopBar({
  onBack,
  locale,
}: {
  onBack: () => void
  locale: "it" | "en"
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="h-10 rounded-full border border-zinc-800 bg-black/30 px-4 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
      >
        ← {locale === "en" ? "Back to map" : "Torna alla mappa"}
      </button>

      <div className="rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-green-300">
        Play
      </div>
    </div>
  )
}