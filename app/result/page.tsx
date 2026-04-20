"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { toPng } from "html-to-image"
import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { AdSenseBanner } from "@/components/adsense-banner"
import { ResultShareCard } from "@/components/result-share-card"
import { supabase } from "@/lib/supabase"
import { generateShareCode, PlayerAnswer } from "@/lib/challenge"
import {
  GAME_MODE_LABELS,
  GameMode,
  getResultMessage,
} from "@/lib/game-mode"

export default function ResultPage() {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement | null>(null)

  const [nickname, setNickname] = useState("")
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [mode, setMode] = useState<GameMode>("normal")
  const [answers, setAnswers] = useState<PlayerAnswer[]>([])
  const [questionIds, setQuestionIds] = useState<number[]>([])
  const [creatingChallenge, setCreatingChallenge] = useState(false)
  const [existingChallengeCode, setExistingChallengeCode] = useState<string | null>(null)
  const [downloadingCard, setDownloadingCard] = useState(false)

  useEffect(() => {
    const savedName = localStorage.getItem("linguo_nickname")
    const savedScore = localStorage.getItem("linguo_score")
    const savedTotal = localStorage.getItem("linguo_total")
    const savedAnswers = localStorage.getItem("linguo_answers")
    const savedQuestionIds = localStorage.getItem("linguo_question_ids")
    const savedChallengeCode = localStorage.getItem("linguo_last_challenge_code")
    const savedMode = localStorage.getItem("linguo_mode") as GameMode | null

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

    if (
      savedMode === "normal" ||
      savedMode === "hard" ||
      savedMode === "similar"
    ) {
      setMode(savedMode)
    }
  }, [router])

  const handleReplay = () => {
    localStorage.removeItem("linguo_last_challenge_code")
    router.push("/play")
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const handleDownloadCard = async () => {
    if (!cardRef.current) return

    try {
      setDownloadingCard(true)

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#050505",
      })

      const link = document.createElement("a")
      link.download = `linguo-${nickname}-${score}-${total}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Errore download card:", error)
      alert("Non sono riuscito a scaricare la card.")
    } finally {
      setDownloadingCard(false)
    }
  }

  const openShare = async (shareCode: string) => {
    const challengeUrl = `${window.location.origin}/challenge/${shareCode}`
    const shareText = `${nickname} ha fatto ${score}/${total} in modalità ${GAME_MODE_LABELS[mode]} su Linguo. Riuscirai a batterlo?`

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
      mode,
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

  const resultMessage = getResultMessage(mode, score, total)

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
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.08,
                      delayChildren: 0.05,
                    },
                  },
                }}
                className="space-y-5"
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 12, filter: "blur(8px)" },
                    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
                  }}
                  transition={{ duration: 0.35 }}
                  className="space-y-3 text-center"
                >
                  <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                    risultato
                  </p>

                  <div className="space-y-1">
                    <p className="text-sm text-green-400">{GAME_MODE_LABELS[mode]}</p>
                    <motion.h1
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, delay: 0.08 }}
                      className="text-3xl font-semibold tracking-tight"
                    >
                      {nickname} ha fatto {score}/{total}
                    </motion.h1>
                  </div>

                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.14 }}
                    className="text-zinc-400"
                  >
                    {resultMessage}
                  </motion.p>
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
                    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
                  }}
                  transition={{ duration: 0.4 }}
                  ref={cardRef}
                >
                  <ResultShareCard
                    nickname={nickname}
                    score={score}
                    total={total}
                    modeLabel={GAME_MODE_LABELS[mode]}
                    message={resultMessage}
                  />
                </motion.div>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.07,
                      delayChildren: 0.22,
                    },
                  },
                }}
                className="space-y-3"
              >
                {[
                  {
                    key: "download",
                    label: downloadingCard ? "Preparo la card..." : "Scarica card",
                    onClick: handleDownloadCard,
                    disabled: downloadingCard,
                    className:
                      "h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-900 text-base font-medium text-white transition-all duration-200 hover:bg-zinc-800 disabled:opacity-60",
                  },
                  {
                    key: "replay",
                    label: "Rigioca",
                    onClick: handleReplay,
                    disabled: false,
                    className:
                      "h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400",
                  },
                  {
                    key: "share",
                    label: creatingChallenge ? "Creo la challenge..." : "Condividi challenge",
                    onClick: handleShare,
                    disabled: creatingChallenge,
                    className:
                      "h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-900 text-base font-medium text-white transition-all duration-200 hover:bg-zinc-800 disabled:opacity-60",
                  },
                  {
                    key: "home",
                    label: "Torna alla home",
                    onClick: handleGoHome,
                    disabled: false,
                    className:
                      "h-12 w-full rounded-2xl border border-zinc-800 bg-transparent text-base font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900",
                  },
                ].map((item) => (
                  <motion.div
                    key={item.key}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.28 }}
                  >
                    <Button
                      onClick={item.onClick}
                      disabled={item.disabled}
                      className={item.className}
                    >
                      {item.label}
                    </Button>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.42 }}
              >
                <AdSenseBanner slot="5943539542" className="min-h-36" />
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}