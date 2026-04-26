"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { Progress } from "@/components/progress"
import { useLocale } from "@/components/locale-provider"
import { useToast } from "@/components/toast-provider"
import { questions, Question } from "@/lib/questions"
import { getLanguageLabel } from "@/lib/language-labels"
import {
  getActiveRankedSeason,
  getRankedLeaderboard,
  getRankedPositionForPlayer,
  RankedEntry,
  RankedSeason,
} from "@/lib/ranked"
import { submitRankedEntry } from "@/lib/ranked-submit"
import { getSmartOptions } from "@/lib/quiz-options"
import { getFlagFromCode } from "@/lib/countries"
import { trackEvent } from "@/lib/analytics"
import { getPlayerToken } from "@/lib/player-token"
import { setRankedLastAttemptNow } from "@/lib/ranked-cooldown"

type RankedAnswer = {
  questionId: number
  selected: string | null
  correct: string
  isCorrect: boolean
  timeMs: number
  timedOut: boolean
}

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

function getRankedMessage(
  score: number,
  total: number,
  locale: "it" | "en"
) {
  const ratio = score / total

  if (locale === "en") {
    if (ratio <= 0.2) return "The leaderboard looked at you and stayed calm."
    if (ratio <= 0.4) return "Not tragic, but not exactly legendary."
    if (ratio <= 0.6) return "Decent. The top 50 might still laugh."
    if (ratio <= 0.8) return "Strong run. Now it's getting serious."
    if (ratio < 1) return "Excellent. You're dangerously close to the top."
    return "Perfect run. Now let the world deal with it."
  }

  if (ratio <= 0.2) return "La classifica ti ha guardato senza scomporsi."
  if (ratio <= 0.4) return "Non tragico, ma nemmeno memorabile."
  if (ratio <= 0.6) return "Buona run. La top 50 però giudica."
  if (ratio <= 0.8) return "Molto forte. Qui si fa seria."
  if (ratio < 1) return "Ottima run. Sei pericolosamente vicino ai migliori."
  return "Run perfetta. Adesso il mondo se la vede con te."
}

export default function RankedPlayPage() {
  const router = useRouter()
  const { locale, t } = useLocale()
  const { showToast } = useToast()

  const [season, setSeason] = useState<RankedSeason | null>(null)
  const [rankedQuestions, setRankedQuestions] = useState<Question[]>([])
  const [nickname, setNickname] = useState("")
  const [countryCode, setCountryCode] = useState("IT")

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<RankedAnswer[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)
  const [totalTimeMs, setTotalTimeMs] = useState(0)

  const [leaderboard, setLeaderboard] = useState<RankedEntry[]>([])
  const [submitStatus, setSubmitStatus] = useState<"inserted" | "updated" | "kept_existing" | null>(null)
  const [playerPosition, setPlayerPosition] = useState<number | null>(null)
  const [totalRankedPlayers, setTotalRankedPlayers] = useState<number>(0)

  const questionStartRef = useRef<number>(Date.now())
  const timerLockedRef = useRef(false)

  useEffect(() => {
    const savedNickname = localStorage.getItem("linguo_ranked_nickname")
    const savedCountry = localStorage.getItem("linguo_ranked_country")

    if (!savedNickname) {
      router.push("/ranked")
      return
    }

    setNickname(savedNickname)
    setCountryCode(savedCountry || "IT")
  }, [router])

  useEffect(() => {
    const loadSeason = async () => {
      try {
        setLoading(true)

        const currentSeason = await getActiveRankedSeason()
        const ids = currentSeason.question_ids as number[]

        const orderedQuestions = ids
          .map((id) => questions.find((q) => q.id === id))
          .filter(Boolean) as Question[]

        if (orderedQuestions.length !== 15) {
          throw new Error("Ranked season questions missing.")
        }

        setSeason(currentSeason)
        setRankedQuestions(orderedQuestions)

        questionStartRef.current = Date.now()
        setTimeLeft(10)
      } catch (error) {
        console.error(error)
        showToast(
          locale === "en"
            ? "I couldn't load the ranked season."
            : "Non sono riuscito a caricare la season ranked.",
          "error"
        )
        router.push("/ranked")
      } finally {
        setLoading(false)
      }
    }

    loadSeason()
  }, [locale, router, showToast])

  const currentQuestion = useMemo(() => {
    return rankedQuestions[currentIndex] ?? null
  }, [rankedQuestions, currentIndex])

  const options = useMemo(() => {
    if (!currentQuestion) return []
    return getSmartOptions(currentQuestion.correct, currentQuestion.id, "hard")
  }, [currentQuestion])

  useEffect(() => {
    if (loading || finished || showFeedback || !currentQuestion) return

    timerLockedRef.current = false
    setTimeLeft(10)
    questionStartRef.current = Date.now()

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval)

          if (!timerLockedRef.current) {
            timerLockedRef.current = true
            void handleAnswer(null, true)
          }

          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [loading, finished, showFeedback, currentQuestion])

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
        if (!season) return

        setRankedLastAttemptNow()

        try {
          setSubmitting(true)

          const result = await submitRankedEntry({
            seasonId: season.id,
            nickname,
            countryCode,
            score: nextScore,
            totalQuestions: rankedQuestions.length,
            totalTimeMs: nextTotalTime,
            answers: nextAnswers,
          })

          const playerToken = getPlayerToken()
          const [top, positionInfo] = await Promise.all([
            getRankedLeaderboard(season.id),
            getRankedPositionForPlayer(season.id, playerToken),
          ])

          setSubmitStatus(result.status)
          setLeaderboard(top.slice(0, 10))
          setPlayerPosition(positionInfo.position)
          setTotalRankedPlayers(positionInfo.total)
          setFinished(true)

          trackEvent("game_complete", {
            mode: "ranked",
            score: nextScore,
            total: rankedQuestions.length,
            total_time_ms: nextTotalTime,
            locale,
          })
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
          router.push("/ranked")
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

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 py-8">
          <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <p className="text-zinc-300">{t("common.loading")}</p>
          </Card>
        </div>
      </main>
    )
  }

  if (!currentQuestion && !finished) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 py-8">
          <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <div className="space-y-4">
              <p className="text-zinc-300">
                {locale === "en"
                  ? "No ranked questions available."
                  : "Nessuna domanda ranked disponibile."}
              </p>
              <Button
                onClick={() => router.push("/ranked")}
                className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
              >
                {t("common.backHome")}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    )
  }

  if (finished) {
    const message = getRankedMessage(score, rankedQuestions.length, locale)
    const accuracy = ((score / rankedQuestions.length) * 100).toFixed(2)

    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-md px-5 py-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            <Card className="rounded-[36px] border border-white/10 bg-black/40 p-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                    {t("ranked.title")}
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-white">
                    {nickname}
                  </h1>
                  <p className="text-sm text-green-400">
                    {getFlagFromCode(countryCode)} {score}/{rankedQuestions.length}
                  </p>
                  <p className="text-zinc-400">{message}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-left">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {t("ranked.score")}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-green-400">
                      {accuracy}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-left">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {t("ranked.time")}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-green-400">
                      {formatTime(totalTimeMs)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-left">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Status
                  </p>
                  <p className="mt-2 text-sm text-white">
                    {submitStatus === "updated" &&
                      (locale === "en"
                        ? "Your best ranked result was improved."
                        : "Hai migliorato il tuo miglior risultato ranked.")}
                    {submitStatus === "inserted" &&
                      (locale === "en"
                        ? "Your ranked run was added to the season."
                        : "La tua run ranked è stata aggiunta alla season.")}
                    {submitStatus === "kept_existing" &&
                      (locale === "en"
                        ? "Your previous best ranked result remains on the board."
                        : "Il tuo precedente miglior risultato resta in classifica.")}
                  </p>
                </div>

                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-left">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {locale === "en" ? "Your position" : "La tua posizione"}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-green-400">
                    {playerPosition
                      ? `#${playerPosition}${totalRankedPlayers ? ` / ${totalRankedPlayers}` : ""}`
                      : locale === "en"
                        ? "Not available"
                        : "Non disponibile"}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => router.push("/ranked")}
                    disabled={submitting}
                    className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
                  >
                    {locale === "en" ? "Back to ranked" : "Torna alla ranked"}
                  </Button>

                  <Button
                    onClick={() => router.push("/")}
                    className="h-12 w-full rounded-2xl border border-zinc-800 bg-transparent text-base font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
                  >
                    {t("common.backHome")}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="rounded-[30px] border border-white/10 bg-black/40 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                    {t("ranked.top10")}
                  </p>
                </div>

                {leaderboard.length === 0 ? (
                  <p className="text-center text-sm text-zinc-400">
                    {t("ranked.empty")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`grid grid-cols-[40px_1fr_auto_auto] items-center gap-3 rounded-2xl px-3 py-3 ${entry.nickname === nickname &&
                          entry.country_code === countryCode &&
                          entry.score === score &&
                          entry.total_time_ms === totalTimeMs
                          ? "bg-green-500/10 ring-1 ring-green-500/30"
                          : "bg-zinc-950/70"
                          }`}
                      >
                        <p className="text-sm text-zinc-500">#{index + 1}</p>

                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {getFlagFromCode(entry.country_code)} {entry.nickname}
                          </p>
                        </div>

                        <p className="text-sm text-green-400">
                          {entry.score}/{entry.total_questions}
                        </p>

                        <p className="text-sm text-zinc-400">
                          {formatTime(entry.total_time_ms)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    )
  }

  const progressValue = ((currentIndex + 1) / rankedQuestions.length) * 100

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          <Card className="rounded-[36px] border border-white/10 bg-black/40 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-zinc-400">
                  <span>
                    {getFlagFromCode(countryCode)} {nickname}
                  </span>
                  <span>Ranked</span>
                </div>

                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>
                    {currentIndex + 1}/{rankedQuestions.length}
                  </span>
                  <span>
                    {t("quiz.score")}: {score}
                  </span>
                </div>

                <Progress value={progressValue} className="h-2 rounded-full" />

                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Timer
                  </p>
                  <p
                    className={`mt-1 text-2xl font-semibold ${timeLeft <= 3 ? "text-red-400" : "text-green-400"
                      }`}
                  >
                    {timeLeft}s
                  </p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion!.id}
                  initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
                  transition={{ duration: 0.28 }}
                  className="space-y-5"
                >
                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-inner">
                    <p className="text-xl font-medium leading-8 text-white">
                      {currentQuestion!.text}
                    </p>
                  </div>

                  <div className="grid gap-3">
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
                        <motion.div
                          key={option}
                          whileTap={!showFeedback ? { scale: 0.985 } : undefined}
                          animate={
                            isWrongSelected
                              ? { x: [0, -6, 6, -4, 4, 0] }
                              : isCorrectShown
                                ? {
                                  scale: [1, 1.025, 1],
                                  boxShadow: [
                                    "0 0 0 rgba(34,197,94,0)",
                                    "0 0 18px rgba(34,197,94,0.28)",
                                    "0 0 0 rgba(34,197,94,0)",
                                  ],
                                }
                                : {
                                  x: 0,
                                  scale: 1,
                                  boxShadow: "0 0 0 rgba(0,0,0,0)",
                                }
                          }
                          transition={{
                            duration: isWrongSelected ? 0.35 : 0.4,
                          }}
                          className="w-full rounded-2xl"
                        >
                          <Button
                            className={`${buttonStyle} w-full`}
                            onClick={() => void handleAnswer(option, false)}
                            disabled={showFeedback || submitting}
                          >
                            {getLanguageLabel(option, locale)}
                          </Button>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}