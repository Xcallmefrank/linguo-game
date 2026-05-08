"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"

import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { Progress } from "@/components/progress"
import { AdSenseBanner } from "@/components/adsense-banner"
import { useLocale } from "@/components/locale-provider"
import { useToast } from "@/components/toast-provider"
import { useAuth } from "@/components/auth-provider"

import { signInWithGoogle } from "@/lib/auth"
import { getMyProfile } from "@/lib/profile"
import { questions, type Question } from "@/lib/questions"
import { getLanguageLabel } from "@/lib/language-labels"
import { getSmartOptions } from "@/lib/quiz-options"
import { getFlagFromCode } from "@/lib/countries"
import { trackEvent } from "@/lib/analytics"
import { grantRankedJourneyXp, type BadgeDefinition } from "@/lib/journey"
import {
  getActiveRankedSeason,
  getMyRankedStanding,
  getNextRunNumber,
  getQuestionsForRun,
  submitRankedRun,
  type RankedSeason,
  type RankedStanding,
} from "@/lib/ranked-v2"

type RankedAnswer = {
  questionId: number
  selected: string | null
  correct: string
  isCorrect: boolean
  timeMs: number
  timedOut: boolean
}

type GateState =
  | "checking-auth"
  | "signing-in"
  | "checking-profile"
  | "loading-season"
  | "ready"
  | "error"

type JourneyAwardState = {
  xpAwarded: number
  unlockedBadges: BadgeDefinition[]
} | null

function formatTime(ms: number | null) {
  if (ms === null) return "--"

  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

function getRankedRunMessage(
  score: number,
  total: number,
  locale: "it" | "en"
) {
  const ratio = score / total

  if (locale === "en") {
    if (ratio <= 0.2) return "That was brutal."
    if (ratio <= 0.4) return "Not glorious, but survivable."
    if (ratio <= 0.6) return "Decent run. The season keeps judging."
    if (ratio <= 0.8) return "Strong run. You're building something."
    if (ratio < 1) return "Excellent. One more sharp push."
    return "Perfect run. Very annoying, in a good way."
  }

  if (ratio <= 0.2) return "Run brutale."
  if (ratio <= 0.4) return "Non gloriosa, ma sopravvissuta."
  if (ratio <= 0.6) return "Buona run. La season però osserva."
  if (ratio <= 0.8) return "Run forte. Stai costruendo bene."
  if (ratio < 1) return "Ottima run. Serve solo un altro colpo pulito."
  return "Run perfetta. Fastidiosamente bella."
}

export default function RankedPlayPage() {
  const router = useRouter()

  const { locale, t } = useLocale()
  const { showToast } = useToast()
  const { user, loading: authLoading } = useAuth()

  const [gateState, setGateState] = useState<GateState>("checking-auth")
  const [season, setSeason] = useState<RankedSeason | null>(null)
  const [rankedQuestions, setRankedQuestions] = useState<Question[]>([])
  const [profileNickname, setProfileNickname] = useState<string | null>(null)
  const [countryCode, setCountryCode] = useState("IT")
  const [currentRunNumber, setCurrentRunNumber] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<RankedAnswer[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)
  const [totalTimeMs, setTotalTimeMs] = useState(0)
  const [standing, setStanding] = useState<RankedStanding | null>(null)
  const [journeyAward, setJourneyAward] = useState<JourneyAwardState>(null)

  const questionStartRef = useRef(Date.now())
  const timerLockedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    const loadSeason = async () => {
      try {
        if (authLoading) {
          setGateState("checking-auth")
          return
        }

        if (!user) {
          setGateState("signing-in")
          await signInWithGoogle()
          return
        }

        setGateState("checking-profile")

        const profile = await getMyProfile(user.id)

        if (cancelled) return

        if (!profile) {
          router.replace("/complete-profile")
          return
        }

        setProfileNickname(profile.nickname)
        setCountryCode(profile.country_code)
        setGateState("loading-season")

        const currentSeason = await getActiveRankedSeason()
        const nextRun = await getNextRunNumber(currentSeason.id, user.id)

        if (cancelled) return

        if (nextRun === null) {
          showToast(
            locale === "en"
              ? "You already completed all 3 runs for this season."
              : "Hai già completato tutte e 3 le run di questa season.",
            "error"
          )

          router.replace("/ranked")
          return
        }

        const runQuestionIds = getQuestionsForRun(currentSeason, nextRun)
        const orderedQuestions = runQuestionIds
          .map((id) => questions.find((question) => question.id === id))
          .filter(Boolean) as Question[]

        if (orderedQuestions.length !== 10) {
          throw new Error("La run non contiene 10 domande valide.")
        }

        setSeason(currentSeason)
        setCurrentRunNumber(nextRun)
        setRankedQuestions(orderedQuestions)
        questionStartRef.current = Date.now()
        setTimeLeft(10)
        setGateState("ready")
      } catch (error) {
        console.error(error)

        if (!cancelled) {
          setGateState("error")

          showToast(
            error instanceof Error
              ? error.message
              : locale === "en"
                ? "I couldn't load the ranked run."
                : "Non sono riuscito a caricare la run ranked.",
            "error"
          )
        }
      }
    }

    void loadSeason()

    return () => {
      cancelled = true
    }
  }, [authLoading, user, router, locale, showToast])

  const currentQuestion = useMemo(() => {
    return rankedQuestions[currentIndex] ?? null
  }, [rankedQuestions, currentIndex])

  const options = useMemo(() => {
    if (!currentQuestion) return []

    return getSmartOptions(currentQuestion.correct, currentQuestion.id, "hard")
  }, [currentQuestion])

  const handleAnswer = async (option: string | null, timedOut = false) => {
    if (!currentQuestion || showFeedback) return
    if (timerLockedRef.current && !timedOut) return

    timerLockedRef.current = true
    setShowFeedback(true)
    setSelectedAnswer(option)

    const timeSpent = Math.min(Date.now() - questionStartRef.current, 10000)
    const isCorrect = option === currentQuestion.correct
    const nextScore = isCorrect ? score + 1 : score

    if (isCorrect) {
      setScore(nextScore)
    }

    const nextAnswer: RankedAnswer = {
      questionId: currentQuestion.id,
      selected: option,
      correct: currentQuestion.correct,
      isCorrect,
      timeMs: timeSpent,
      timedOut,
    }

    const nextAnswers = [...answers, nextAnswer]
    const nextTotalTime = totalTimeMs + timeSpent

    setAnswers(nextAnswers)
    setTotalTimeMs(nextTotalTime)

    window.setTimeout(async () => {
      const nextIndex = currentIndex + 1

      if (nextIndex >= rankedQuestions.length) {
        if (!season || !user || !currentRunNumber) return

        try {
          setSubmitting(true)

          const submitResult = await submitRankedRun({
            seasonId: season.id,
            userId: user.id,
            score: nextScore,
            totalQuestions: rankedQuestions.length,
            totalTimeMs: nextTotalTime,
            answers: nextAnswers,
          })

          const updatedStanding = await getMyRankedStanding(season.id, user.id)

          setStanding(updatedStanding)
          setFinished(true)

          trackEvent("game_complete", {
            mode: "ranked",
            run_number: currentRunNumber,
            score: nextScore,
            total: rankedQuestions.length,
            total_time_ms: nextTotalTime,
            locale,
          })

          try {
            const journeyResult = await grantRankedJourneyXp({
              userId: user.id,
              seasonId: season.id,
              runNumber: submitResult.runNumber,
              score: nextScore,
              totalQuestions: rankedQuestions.length,
              totalTimeMs: nextTotalTime,
              runsCompleted: submitResult.runsCompleted,
              position: updatedStanding.position,
            })

            if (journeyResult.awarded) {
              setJourneyAward({
                xpAwarded: journeyResult.xpAwarded,
                unlockedBadges: journeyResult.unlockedBadges,
              })

              const badgeText =
                journeyResult.unlockedBadges.length > 0
                  ? locale === "en"
                    ? ` Badge unlocked: ${journeyResult.unlockedBadges
                        .map((badge) => badge.title.en)
                        .join(", ")}`
                    : ` Badge sbloccato: ${journeyResult.unlockedBadges
                        .map((badge) => badge.title.it)
                        .join(", ")}`
                  : ""

              showToast(
                locale === "en"
                  ? `+${journeyResult.xpAwarded} XP earned.${badgeText}`
                  : `+${journeyResult.xpAwarded} XP guadagnati.${badgeText}`,
                "success"
              )
            }
          } catch (journeyError) {
            console.error("Errore aggiornamento Journey ranked:", journeyError)
          }
        } catch (error) {
          console.error(error)

          showToast(
            error instanceof Error
              ? error.message
              : locale === "en"
                ? "I couldn't submit your ranked run."
                : "Non sono riuscito a inviare la tua run ranked.",
            "error"
          )

          router.replace("/ranked")
        } finally {
          setSubmitting(false)
        }

        return
      }

      setCurrentIndex(nextIndex)
      setSelectedAnswer(null)
      setShowFeedback(false)
    }, 650)
  }

  useEffect(() => {
    if (gateState !== "ready" || finished || showFeedback || !currentQuestion) {
      return
    }

    timerLockedRef.current = false
    setTimeLeft(10)
    questionStartRef.current = Date.now()

    const interval = window.setInterval(() => {
      setTimeLeft((previousValue) => {
        if (previousValue <= 1) {
          window.clearInterval(interval)

          if (!timerLockedRef.current) {
            timerLockedRef.current = true
            void handleAnswer(null, true)
          }

          return 0
        }

        return previousValue - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [gateState, finished, showFeedback, currentQuestion])

  if (authLoading || gateState !== "ready") {
    return (
      <main className="min-h-screen px-5 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              ranked
            </p>

            <h1 className="mt-4 text-2xl font-semibold text-white">
              {authLoading && "Controllo sessione..."}
              {!authLoading &&
                gateState === "checking-auth" &&
                "Controllo accesso..."}
              {!authLoading &&
                gateState === "signing-in" &&
                "Ti porto al login Google..."}
              {!authLoading &&
                gateState === "checking-profile" &&
                "Controllo profilo..."}
              {!authLoading &&
                gateState === "loading-season" &&
                "Preparo la run..."}
              {!authLoading &&
                gateState === "error" &&
                "C'è stato un problema nel caricamento."}
            </h1>

            {gateState === "error" ? (
              <Button
                onClick={() => router.push("/ranked")}
                className="mt-6 h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
              >
                Torna alla ranked
              </Button>
            ) : null}
          </Card>
        </div>
      </main>
    )
  }

  if (!currentQuestion && !finished) {
    return (
      <main className="min-h-screen px-5 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <h1 className="text-2xl font-semibold text-white">
              {locale === "en"
                ? "No ranked questions available."
                : "Nessuna domanda ranked disponibile."}
            </h1>

            <Button
              onClick={() => router.push("/ranked")}
              className="mt-6 h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
            >
              Torna alla ranked
            </Button>
          </Card>
        </div>
      </main>
    )
  }

  if (finished) {
    const message = getRankedRunMessage(score, rankedQuestions.length, locale)
    const accuracy = ((score / rankedQuestions.length) * 100).toFixed(2)

    return (
      <main className="min-h-screen px-5 py-10">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="rounded-[36px] border border-white/10 bg-black/40 p-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                ranked
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                {profileNickname}
              </h1>

              <p className="mt-3 text-sm text-zinc-400">
                {getFlagFromCode(countryCode)} Run {currentRunNumber}/3 ·{" "}
                {score}/{rankedQuestions.length}
              </p>

              <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-zinc-400">
                {message}
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <RankedResultStat label="Accuracy run" value={`${accuracy}%`} />
                <RankedResultStat label="Tempo run" value={formatTime(totalTimeMs)} />
              </div>

              {journeyAward ? (
                <div className="mt-5 rounded-[28px] border border-green-500/20 bg-green-500/10 p-5 text-left">
                  <p className="text-xs uppercase tracking-[0.18em] text-green-300">
                    Journey
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-white">
                    +{journeyAward.xpAwarded} XP
                  </p>

                  <p className="mt-2 text-sm text-zinc-300">
                    {locale === "en"
                      ? "Ranked progress updated."
                      : "Progressione ranked aggiornata."}
                  </p>

                  {journeyAward.unlockedBadges.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {journeyAward.unlockedBadges.map((badge) => (
                        <div
                          key={badge.id}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-3 py-3"
                        >
                          <span className="text-xl">{badge.icon}</span>
                          <span className="text-sm font-medium text-white">
                            {locale === "en" ? badge.title.en : badge.title.it}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-7 rounded-[28px] border border-white/10 bg-zinc-950/70 p-5 text-left">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Stato season
                </p>

                <div className="mt-4 space-y-2 text-sm text-zinc-300">
                  <p>
                    Run completate:{" "}
                    <span className="font-semibold text-white">
                      {standing?.runs_completed ?? 0}/3
                    </span>
                  </p>

                  <p>
                    Media score:{" "}
                    <span className="font-semibold text-white">
                      {standing?.avg_score ?? "--"}
                    </span>
                  </p>

                  <p>
                    Tempo medio:{" "}
                    <span className="font-semibold text-white">
                      {formatTime(standing?.avg_time_ms ?? null)}
                    </span>
                  </p>
                </div>

                {standing?.is_official ? (
                  <p className="mt-4 text-sm font-semibold text-green-300">
                    Posizione ufficiale:{" "}
                    {standing.position
                      ? `#${standing.position} / ${standing.total_ranked_users}`
                      : "Non disponibile"}
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-zinc-500">
                    Completa tutte e 3 le run per entrare nella classifica
                    ufficiale.
                  </p>
                )}
              </div>

              <div className="mt-7 space-y-3">
                <Button
                  onClick={() => router.push("/ranked")}
                  disabled={submitting}
                  className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
                >
                  Torna alla ranked
                </Button>

                <Button
                  onClick={() => router.push("/")}
                  className="h-12 w-full rounded-2xl border border-zinc-800 bg-transparent text-base font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
                >
                  {t("common.backHome")}
                </Button>
              </div>
            </Card>
          </motion.div>

          <div className="mt-6">
            <AdSenseBanner slot="5675946231" className="min-h-24" />
          </div>
        </div>
      </main>
    )
  }

  const progressValue = ((currentIndex + 1) / rankedQuestions.length) * 100

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Card className="rounded-[36px] border border-white/10 bg-black/40 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">
                {getFlagFromCode(countryCode)} {profileNickname}
              </p>

              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
                Run {currentRunNumber}/3
              </p>
            </div>

            <div className="rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300">
              {currentIndex + 1}/{rankedQuestions.length}
            </div>
          </div>

          <div className="mt-5">
            <Progress value={progressValue} />
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3">
            <p className="text-sm text-zinc-400">
              {t("quiz.score")}:{" "}
              <span className="font-semibold text-white">{score}</span>
            </p>

            <p className="text-sm text-zinc-400">
              Timer:{" "}
              <span className="font-semibold text-green-300">{timeLeft}s</span>
            </p>
          </div>

          <motion.div
            key={currentQuestion!.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-7"
          >
            <h1 className="text-3xl font-semibold leading-tight text-white">
              {currentQuestion!.text}
            </h1>

            <div className="mt-7 grid gap-3">
              {options.map((option) => {
                const isCorrect = option === currentQuestion!.correct
                const isSelected = option === selectedAnswer
                const isWrongSelected = showFeedback && isSelected && !isCorrect
                const isCorrectShown = showFeedback && isCorrect

                let buttonStyle =
                  "min-h-14 w-full justify-start rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-4 text-left text-base leading-6 text-white transition-all duration-200"

                if (isCorrectShown) {
                  buttonStyle += " border-green-500 bg-green-500 text-black"
                } else if (isWrongSelected) {
                  buttonStyle += " border-red-500 bg-red-500 text-white"
                } else {
                  buttonStyle += " hover:border-zinc-600 hover:bg-zinc-900"
                }

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => void handleAnswer(option, false)}
                    disabled={showFeedback || submitting}
                    className={buttonStyle}
                  >
                    {getLanguageLabel(option, locale)}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </Card>
      </div>
    </main>
  )
}

function RankedResultStat({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-green-300">{value}</p>
    </div>
  )
}