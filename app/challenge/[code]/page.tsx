"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Card } from "@/components/card"
import { Input } from "@/components/input"
import { Button } from "@/components/button"
import { supabase } from "@/lib/supabase"
import { GAME_MODE_LABELS, GameMode } from "@/lib/game-mode"

type ChallengeData = {
  id: string
  share_code: string
  creator_name: string
  creator_score: number
  total_questions: number
  mode: GameMode | null
}

export default function ChallengePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const router = useRouter()

  const [code, setCode] = useState("")
  const [nickname, setNickname] = useState("")
  const [challenge, setChallenge] = useState<ChallengeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadChallenge = async () => {
      const resolvedParams = await params
      const challengeCode = resolvedParams.code
      setCode(challengeCode)

      const { data, error } = await supabase
        .from("challenges")
        .select("id, share_code, creator_name, creator_score, total_questions, mode")
        .eq("share_code", challengeCode)
        .single()

      if (error || !data) {
        console.error("Challenge non trovata:", error)
        router.push("/")
        return
      }

      setChallenge(data)
      setLoading(false)
    }

    loadChallenge()
  }, [params, router])

  const handleAcceptChallenge = () => {
    const cleanName = nickname.trim()
    if (cleanName.length < 2 || !challenge) return

    const challengeMode =
      challenge.mode === "hard" || challenge.mode === "similar"
        ? challenge.mode
        : "normal"

    localStorage.setItem("linguo_nickname", cleanName)
    localStorage.setItem("linguo_mode", challengeMode)
    localStorage.setItem("linguo_active_challenge_code", challenge.share_code)

    router.push(`/play?challenge=${challenge.share_code}`)
  }

  if (loading || !challenge) return null

  const challengeMode =
    challenge.mode === "hard" || challenge.mode === "similar"
      ? challenge.mode
      : "normal"

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
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                  challenge
                </p>

                <p className="text-sm text-green-400">
                  {GAME_MODE_LABELS[challengeMode]}
                </p>

                <h1 className="text-3xl font-semibold tracking-tight">
                  {challenge.creator_name} ha fatto {challenge.creator_score}/
                  {challenge.total_questions}
                </h1>

                <p className="text-zinc-400">Riuscirai a batterlo?</p>
              </div>

              <div className="space-y-3">
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Il tuo nome"
                  maxLength={12}
                  className="w-full rounded-2xl border-zinc-700 bg-zinc-950/80 px-5 py-4 text-center text-base text-white shadow-inner placeholder:text-zinc-500"
                />

                <Button
                  onClick={handleAcceptChallenge}
                  disabled={nickname.trim().length < 2}
                  className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400 disabled:bg-zinc-800 disabled:text-zinc-500"
                >
                  Accetta la sfida
                </Button>

                <Button
                  onClick={() => router.push("/")}
                  className="h-12 w-full rounded-2xl border border-zinc-800 bg-transparent text-base font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
                >
                  Torna alla home
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}