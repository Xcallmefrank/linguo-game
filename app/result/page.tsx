"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { AdSlot } from "@/components/ad-slot"
import { supabase } from "@/lib/supabase"
import { generateShareCode, PlayerAnswer } from "@/lib/challenge"

export default function ResultPage() {
  const router = useRouter()

  const [nickname, setNickname] = useState("")
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [answers, setAnswers] = useState<PlayerAnswer[]>([])
  const [questionIds, setQuestionIds] = useState<number[]>([])
  const [creatingChallenge, setCreatingChallenge] = useState(false)
  const [existingChallengeCode, setExistingChallengeCode] = useState<string | null>(null)

  useEffect(() => {
    const savedName = localStorage.getItem("linguo_nickname")
    const savedScore = localStorage.getItem("linguo_score")
    const savedTotal = localStorage.getItem("linguo_total")
    const savedAnswers = localStorage.getItem("linguo_answers")
    const savedQuestionIds = localStorage.getItem("linguo_question_ids")
    const savedChallengeCode = localStorage.getItem("linguo_last_challenge_code")

    if (
      !savedName ||
      !savedScore ||
      !savedTotal ||
      !savedAnswers ||
      !savedQuestionIds
    ) {
      router.push("/")
      return
    }

    setNickname(savedName)
    setScore(Number(savedScore))
    setTotal(Number(savedTotal))
    setAnswers(JSON.parse(savedAnswers))
    setQuestionIds(JSON.parse(savedQuestionIds))
    setExistingChallengeCode(savedChallengeCode)
  }, [router])

  const handleReplay = () => {
    localStorage.removeItem("linguo_last_challenge_code")
    router.push("/play")
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const openShare = async (shareCode: string) => {
    const challengeUrl = `${window.location.origin}/challenge/${shareCode}`
    const shareText = `${nickname} ha fatto ${score}/${total} su Linguo. Riuscirai a batterlo?`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Linguo",
          text: shareText,
          url: challengeUrl,
        })
      } catch (err) {
        console.error("Condivisione annullata o fallita", err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText} ${challengeUrl}`)
        alert("Challenge copiata negli appunti")
      } catch (err) {
        console.error("Errore nella copia", err)
        alert("Non sono riuscito a copiare la challenge.")
      }
    }
  }

  const handleShare = async () => {
    if (creatingChallenge || answers.length === 0 || questionIds.length === 0) {
      return
    }

    if (existingChallengeCode) {
      await openShare(existingChallengeCode)
      return
    }

    setCreatingChallenge(true)

    let shareCode = generateShareCode()

    const { data: existing } = await supabase
      .from("challenges")
      .select("id")
      .eq("share_code", shareCode)
      .maybeSingle()

    if (existing) {
      shareCode = generateShareCode(10)
    }

    const { error } = await supabase.from("challenges").insert({
      share_code: shareCode,
      creator_name: nickname,
      creator_score: score,
      total_questions: total,
      question_ids: questionIds,
      creator_answers: answers,
    })

    setCreatingChallenge(false)

    if (error) {
      console.error("Errore creazione challenge:", error)
      alert("Non sono riuscito a creare la challenge.")
      return
    }

    localStorage.setItem("linguo_last_challenge_code", shareCode)
    setExistingChallengeCode(shareCode)

    await openShare(shareCode)
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          <Card className="rounded-[36px] border border-white/10 bg-black/40 p-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                  risultato
                </p>

                <h1 className="text-3xl font-semibold tracking-tight">
                  {nickname} ha fatto {score}/{total}
                </h1>

                <p className="text-zinc-400">
                  Bel colpo. Adesso manda la sfida a qualcuno.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleReplay}
                  className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
                >
                  Rigioca
                </Button>

                <Button
                  onClick={handleShare}
                  disabled={creatingChallenge}
                  className="h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-900 text-base font-medium text-white transition-all duration-200 hover:bg-zinc-800 disabled:opacity-60"
                >
                  {creatingChallenge ? "Creo la challenge..." : "Condividi challenge"}
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
        </motion.div>
      </div>
    </main>
  )
}