"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { AdSlot } from "@/components/ad-slot"
import { supabase } from "@/lib/supabase"
import { questions } from "@/lib/questions"
import { PlayerAnswer } from "@/lib/challenge"
import { GAME_MODE_LABELS } from "@/lib/game-mode"

type ChallengeRow = {
  id: string
  creator_name: string
  creator_score: number
  total_questions: number
  question_ids: number[]
  creator_answers: PlayerAnswer[]
  mode: "normal" | "hard" | "similar" | null
}

type AttemptRow = {
  opponent_name: string
  opponent_score: number
  opponent_answers: PlayerAnswer[]
}

type ComparisonRow = {
  questionId: number
  text: string
  correct: string
  creatorAnswer?: PlayerAnswer
  opponentAnswer?: PlayerAnswer
}

export default function ComparePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [creator, setCreator] = useState<ChallengeRow | null>(null)
  const [opponent, setOpponent] = useState<AttemptRow | null>(null)

  useEffect(() => {
    const loadComparison = async () => {
      const resolvedParams = await params

      const { data: challenge, error: challengeError } = await supabase
        .from("challenges")
        .select("*")
        .eq("share_code", resolvedParams.code)
        .single()

      if (challengeError || !challenge) {
        router.push("/")
        return
      }

      const { data: attempt, error: attemptError } = await supabase
        .from("challenge_attempts")
        .select("*")
        .eq("challenge_id", challenge.id)
        .single()

      if (attemptError || !attempt) {
        router.push("/")
        return
      }

      setCreator(challenge as ChallengeRow)
      setOpponent(attempt as AttemptRow)
      setLoading(false)
    }

    loadComparison()
  }, [params, router])

  const comparisonRows = useMemo<ComparisonRow[]>(() => {
    if (!creator || !opponent) return []

    return creator.question_ids.map((questionId) => {
      const question = questions.find((q) => q.id === questionId)
      const creatorAnswer = creator.creator_answers.find(
        (a) => a.questionId === questionId
      )
      const opponentAnswer = opponent.opponent_answers.find(
        (a) => a.questionId === questionId
      )

      return {
        questionId,
        text: question?.text || "Domanda non trovata",
        correct: creatorAnswer?.correct || opponentAnswer?.correct || "",
        creatorAnswer,
        opponentAnswer,
      }
    })
  }, [creator, opponent])

  const winnerText = useMemo(() => {
    if (!creator || !opponent) return ""

    if (creator.creator_score === opponent.opponent_score) {
      return "Pareggio. Fastidiosamente equilibrato."
    }

    if (creator.creator_score > opponent.opponent_score) {
      return `${creator.creator_name} ha vinto`
    }

    return `${opponent.opponent_name} ha vinto`
  }, [creator, opponent])

  const handleGoHome = () => {
    router.push("/")
  }

  const handlePlayAgain = () => {
    localStorage.removeItem("linguo_last_challenge_code")
    router.push("/play")
  }

  if (loading || !creator || !opponent) return null

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
                  confronto
                </p>

                <h1 className="text-3xl font-semibold tracking-tight">
                  {creator.creator_name} vs {opponent.opponent_name}
                </h1>

                <div className="space-y-1">
                  <p className="text-zinc-400">{winnerText}</p>
                  <p className="text-sm text-green-400">
                    {GAME_MODE_LABELS[
                      creator.mode === "hard" || creator.mode === "similar"
                        ? creator.mode
                        : "normal"
                    ]}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                  <p className="text-sm text-zinc-400">{creator.creator_name}</p>
                  <p className="mt-2 text-3xl font-semibold text-green-400">
                    {creator.creator_score}/{creator.total_questions}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                  <p className="text-sm text-zinc-400">{opponent.opponent_name}</p>
                  <p className="mt-2 text-3xl font-semibold text-green-400">
                    {opponent.opponent_score}/{creator.total_questions}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handlePlayAgain}
                  className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
                >
                  Nuova partita
                </Button>

                <Button
                  onClick={handleGoHome}
                  className="h-12 w-full rounded-2xl border border-zinc-800 bg-transparent text-base font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
                >
                  Torna alla home
                </Button>
              </div>

              <AdSlot label="Banner pubblicitario" tall />
            </div>
          </Card>

          <div className="space-y-4">
            {comparisonRows.map((row, index) => (
              <Card
                key={row.questionId}
                className="rounded-[28px] border border-white/10 bg-black/40 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl"
              >
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      domanda {index + 1}
                    </p>
                    <p className="mt-2 text-base leading-7 text-white">
                      {row.text}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl bg-zinc-950/70 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-zinc-400">{creator.creator_name}</p>
                        <p
                          className={`font-medium ${row.creatorAnswer?.isCorrect
                              ? "text-green-400"
                              : "text-red-400"
                            }`}
                        >
                          {row.creatorAnswer?.isCorrect ? "Corretta" : "Errata"}
                        </p>
                      </div>
                      <p className="mt-2 font-medium text-white">
                        {row.creatorAnswer?.selected}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-zinc-950/70 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-zinc-400">{opponent.opponent_name}</p>
                        <p
                          className={`font-medium ${row.opponentAnswer?.isCorrect
                              ? "text-green-400"
                              : "text-red-400"
                            }`}
                        >
                          {row.opponentAnswer?.isCorrect ? "Corretta" : "Errata"}
                        </p>
                      </div>
                      <p className="mt-2 font-medium text-white">
                        {row.opponentAnswer?.selected}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3">
                      <p className="text-zinc-400">Risposta corretta</p>
                      <p className="mt-2 font-medium text-green-400">
                        {row.correct}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  )
}