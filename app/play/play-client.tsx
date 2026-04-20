"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { Progress } from "@/components/progress"
import { Question } from "@/lib/questions"
import { PlayerAnswer } from "@/lib/challenge"
import { supabase } from "@/lib/supabase"
import {
  GAME_MODE_LABELS,
  GameMode,
  getQuestionsForMode,
} from "@/lib/game-mode"
import { getSmartOptions } from "@/lib/quiz-options"

export default function PlayClient({
  challengeCode,
}: {
  challengeCode: string | null
}) {
  const router = useRouter()

  const [nickname, setNickname] = useState("")
  const [mode, setMode] = useState<GameMode>("normal")
  const [gameQuestions, setGameQuestions] = useState<Question[]>([])
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<PlayerAnswer[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  useEffect(() => {
    const initGame = async () => {
      try {
        const savedName = localStorage.getItem("linguo_nickname")
        const savedMode = localStorage.getItem("linguo_mode") as GameMode | null

        if (!savedName) {
          router.push("/")
          return
        }

        setNickname(savedName)

        if (!challengeCode) {
          const currentMode =
            savedMode === "hard" || savedMode === "similar" ? savedMode : "normal"

          setMode(currentMode)
          setGameQuestions(getQuestionsForMode(currentMode, 10))
          setLoading(false)
          return
        }

        const { data: challenge, error } = await supabase
          .from("challenges")
          .select("*")
          .eq("share_code", challengeCode)
          .single()

        if (error || !challenge) {
          console.error("Challenge non trovata:", error)
          setPageError("Challenge non trovata.")
          setLoading(false)
          return
        }

        const challengeMode =
          challenge.mode === "hard" || challenge.mode === "similar"
            ? challenge.mode
            : "normal"

        localStorage.setItem("linguo_mode", challengeMode)
        setMode(challengeMode)
        setChallengeId(challenge.id)

        const ids = challenge.question_ids as number[]
        const selectedQuestions = getQuestionsForMode(challengeMode, 100).filter((q) =>
          ids.includes(q.id)
        )

        if (selectedQuestions.length === 0) {
          setPageError("Non sono riuscito a caricare le domande.")
          setLoading(false)
          return
        }

        const orderedQuestions = ids
          .map((id) => selectedQuestions.find((q) => q.id === id))
          .filter(Boolean) as Question[]

        setGameQuestions(orderedQuestions)
        setLoading(false)
      } catch (error) {
        console.error("Errore inizializzazione gioco:", error)
        setPageError("Si è verificato un errore durante il caricamento.")
        setLoading(false)
      }
    }

    initGame()
  }, [router, challengeCode])

  const currentQuestion = useMemo(() => {
    return gameQuestions[currentIndex]
  }, [gameQuestions, currentIndex])

  const handleAnswer = (option: string) => {
    if (showFeedback || !currentQuestion) return

    setSelectedAnswer(option)
    setShowFeedback(true)

    const isCorrect = option === currentQuestion.correct
    const nextScore = isCorrect ? score + 1 : score

    if (isCorrect) {
      setScore(nextScore)
    }

    const newAnswer: PlayerAnswer = {
      questionId: currentQuestion.id,
      selected: option,
      correct: currentQuestion.correct,
      isCorrect,
    }

    const nextAnswers = [...answers, newAnswer]
    setAnswers(nextAnswers)

    setTimeout(async () => {
      const nextIndex = currentIndex + 1

      if (nextIndex >= gameQuestions.length) {
        localStorage.setItem("linguo_score", String(nextScore))
        localStorage.setItem("linguo_total", String(gameQuestions.length))
        localStorage.setItem("linguo_answers", JSON.stringify(nextAnswers))
        localStorage.setItem(
          "linguo_question_ids",
          JSON.stringify(gameQuestions.map((q) => q.id))
        )
        localStorage.setItem("linguo_mode", mode)

        if (!challengeCode) {
          router.push("/result")
          return
        }

        if (!challengeId) {
          router.push("/result")
          return
        }

        const { error } = await supabase.from("challenge_attempts").insert({
          challenge_id: challengeId,
          opponent_name: nickname,
          opponent_score: nextScore,
          opponent_answers: nextAnswers,
        })

        if (error) {
          console.error("Errore salvataggio tentativo:", error)
          alert("Non sono riuscito a salvare il tentativo.")
          router.push("/")
          return
        }

        router.push(`/challenge/${challengeCode}/compare`)
        return
      }

      setCurrentIndex(nextIndex)
      setSelectedAnswer(null)
      setShowFeedback(false)
    }, 900)
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 py-8">
          <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <p className="text-zinc-300">Caricamento gioco...</p>
          </Card>
        </div>
      </main>
    )
  }

  if (pageError) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 py-8">
          <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <div className="space-y-4">
              <p className="text-zinc-300">{pageError}</p>
              <Button
                onClick={() => router.push("/")}
                className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
              >
                Torna alla home
              </Button>
            </div>
          </Card>
        </div>
      </main>
    )
  }

  if (!currentQuestion) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 py-8">
          <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <div className="space-y-4">
              <p className="text-zinc-300">Nessuna domanda disponibile.</p>
              <Button
                onClick={() => router.push("/")}
                className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
              >
                Torna alla home
              </Button>
            </div>
          </Card>
        </div>
      </main>
    )
  }

  const progressValue = ((currentIndex + 1) / gameQuestions.length) * 100
  const options = getSmartOptions(currentQuestion.correct, currentQuestion.id, mode)

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
                  <span>{nickname}</span>
                  <span>{GAME_MODE_LABELS[mode]}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>
                    {currentIndex + 1}/{gameQuestions.length}
                  </span>
                  <span>Punteggio: {score}</span>
                </div>

                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35 }}
                >
                  <Progress value={progressValue} className="h-2 rounded-full" />
                </motion.div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
                  transition={{ duration: 0.28 }}
                  className="space-y-5"
                >
                  <motion.div
                    initial={{ scale: 0.985, opacity: 0.9 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-inner"
                  >
                    <p className="text-xl font-medium leading-8">
                      {currentQuestion.text}
                    </p>
                  </motion.div>

                  <div className="grid gap-3">
                    {options.map((option) => {
                      const isCorrect = option === currentQuestion.correct
                      const isSelected = option === selectedAnswer
                      const isWrongSelected = showFeedback && isSelected && !isCorrect
                      const isCorrectShown = showFeedback && isCorrect

                      let buttonStyle =
                        "h-14 justify-start rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 text-left text-base text-white transition-all duration-200"

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
                              : { x: 0, scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" }
                          }
                          transition={{
                            duration: isWrongSelected ? 0.35 : 0.4,
                          }}
                          className="rounded-2xl"
                        >
                          <Button
                            className={buttonStyle}
                            onClick={() => handleAnswer(option)}
                            disabled={showFeedback}
                          >
                            {option}
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