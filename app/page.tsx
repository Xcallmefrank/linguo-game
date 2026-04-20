"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { Progress } from "@/components/progress"
import { questions, Question } from "@/lib/questions"
import { PlayerAnswer } from "@/lib/challenge"

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]

  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }

  return newArray
}

export default function PlayPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState("")
  const [gameQuestions, setGameQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<PlayerAnswer[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedName = localStorage.getItem("linguo_nickname")
    if (!savedName) {
      router.push("/")
      return
    }

    setNickname(savedName)

    const selectedQuestions = shuffleArray(questions).slice(0, 10)
    setGameQuestions(selectedQuestions)
    setLoading(false)
  }, [router])

  const currentQuestion = useMemo(() => {
    return gameQuestions[currentIndex]
  }, [gameQuestions, currentIndex])

  if (loading || !currentQuestion || gameQuestions.length === 0) return null

  const handleAnswer = (option: string) => {
    if (showFeedback) return

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

    setTimeout(() => {
      const nextIndex = currentIndex + 1

      if (nextIndex >= gameQuestions.length) {
        localStorage.setItem("linguo_score", String(nextScore))
        localStorage.setItem("linguo_total", String(gameQuestions.length))
        localStorage.setItem("linguo_answers", JSON.stringify(nextAnswers))
        localStorage.setItem(
          "linguo_question_ids",
          JSON.stringify(gameQuestions.map((q) => q.id))
        )

        router.push("/result")
        return
      }

      setCurrentIndex(nextIndex)
      setSelectedAnswer(null)
      setShowFeedback(false)
    }, 900)
  }

  const progressValue = ((currentIndex + 1) / gameQuestions.length) * 100

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
                  <span>
                    {currentIndex + 1}/{gameQuestions.length}
                  </span>
                </div>

                <Progress value={progressValue} className="h-2 rounded-full" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-inner">
                    <p className="text-xl leading-8 font-medium">
                      {currentQuestion.text}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {currentQuestion.options.map((option) => {
                      const isCorrect = option === currentQuestion.correct
                      const isSelected = option === selectedAnswer

                      let buttonStyle =
                        "h-14 justify-start rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 text-left text-base text-white transition-all duration-200"

                      if (showFeedback && isCorrect) {
                        buttonStyle += " border-green-500 bg-green-500 text-black"
                      } else if (showFeedback && isSelected && !isCorrect) {
                        buttonStyle += " border-red-500 bg-red-500 text-white"
                      } else {
                        buttonStyle += " hover:border-zinc-600 hover:bg-zinc-900"
                      }

                      return (
                        <Button
                          key={option}
                          className={buttonStyle}
                          onClick={() => handleAnswer(option)}
                          disabled={showFeedback}
                        >
                          {option}
                        </Button>
                      )
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="text-center text-sm text-zinc-500">
                Punteggio: {score}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}