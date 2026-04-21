"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { toPng } from "html-to-image"
import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { AdSenseBanner } from "@/components/adsense-banner"
import { ResultShareCard } from "@/components/result-share-card"
import { useToast } from "@/components/toast-provider"
import { useLocale } from "@/components/locale-provider"
import { supabase } from "@/lib/supabase"
import { generateShareCode, PlayerAnswer } from "@/lib/challenge"
import {
  GAME_MODE_LABELS,
  GameMode,
  getResultMessage,
} from "@/lib/game-mode"
import { getRunStats } from "@/lib/run-stats"

export default function ResultPage() {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement | null>(null)
  const { showToast } = useToast()
  const { t, locale } = useLocale()

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

  const handleOpenChallengeStatus = () => {
    if (!existingChallengeCode) return
    router.push(`/challenge/${existingChallengeCode}/compare`)
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
      showToast(t("toast.downloadError"), "error")
    } finally {
      setDownloadingCard(false)
    }
  }

  const openShare = async (shareCode: string) => {
    const challengeUrl = `${window.location.origin}/challenge/${shareCode}`
    const shareText =
      localeShareText({
        localeT: t,
        nickname,
        score,
        total,
        modeLabel: GAME_MODE_LABELS[mode],
      }) + ` ${challengeUrl}`

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
        await navigator.clipboard.writeText(shareText)
        showToast(t("toast.copyChallenge"), "success")
      } catch (err) {
        console.error("Errore nella copia", err)
        showToast(t("toast.copyError"), "error")
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
      showToast(t("toast.challengeCreateError"), "error")
      return
    }

    localStorage.setItem("linguo_last_challenge_code", shareCode)
    setExistingChallengeCode(shareCode)

    await openShare(shareCode)
  }

  const resultMessage = getResultMessage(mode, score, total, locale)
  const stats = getRunStats(answers)

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
                    {t("result.title")}
                  </p>

                  <div className="space-y-1">
                    <p className="text-sm text-green-400">{t(`mode.${mode}`)}</p>
                    <motion.h1
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, delay: 0.08 }}
                      className="text-3xl font-semibold tracking-tight"
                    >
                      {nickname} {score}/{total}
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
                    modeLabel={t(`mode.${mode}`)}
                    message={resultMessage}
                  />
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
                    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
                  }}
                  transition={{ duration: 0.35 }}
                  className="grid gap-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-left">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        {t("result.bestStreak")}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-green-400">
                        {stats.bestStreak}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-left">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        {t("result.nonLatin")}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-green-400">
                        {stats.nonLatinCorrect}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-left">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {t("result.bestFamily")}
                    </p>

                    {stats.bestFamily ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-lg font-semibold text-white">
                          {stats.bestFamily.label}
                        </p>
                        <p className="text-sm text-zinc-400">
                          {stats.bestFamily.correct}/{stats.bestFamily.total}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-zinc-400">
                        {t("result.noData")}
                      </p>
                    )}
                  </div>
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
                    label: downloadingCard
                      ? t("common.prepareCard")
                      : t("common.downloadCard"),
                    onClick: handleDownloadCard,
                    disabled: downloadingCard,
                    className:
                      "h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-900 text-base font-medium text-white transition-all duration-200 hover:bg-zinc-800 disabled:opacity-60",
                  },
                  {
                    key: "replay",
                    label: t("common.playAgain"),
                    onClick: handleReplay,
                    disabled: false,
                    className:
                      "h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400",
                  },
                  {
                    key: "share",
                    label: creatingChallenge
                      ? t("common.createChallenge")
                      : t("common.shareChallenge"),
                    onClick: handleShare,
                    disabled: creatingChallenge,
                    className:
                      "h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-900 text-base font-medium text-white transition-all duration-200 hover:bg-zinc-800 disabled:opacity-60",
                  },
                  {
                    key: "status",
                    label: t("common.challengeStatus"),
                    onClick: handleOpenChallengeStatus,
                    disabled: !existingChallengeCode,
                    className:
                      "h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-900 text-base font-medium text-white transition-all duration-200 hover:bg-zinc-800 disabled:opacity-40",
                  },
                  {
                    key: "home",
                    label: t("common.backHome"),
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

function localeShareText({
  localeT,
  nickname,
  score,
  total,
  modeLabel,
}: {
  localeT: (key: string) => string
  nickname: string
  score: number
  total: number
  modeLabel: string
}) {
  const isEnglish = localeT("home.start") === "Start"

  if (isEnglish) {
    return `${nickname} scored ${score}/${total} in ${modeLabel} on Linguo. Can you beat them?`
  }

  return `${nickname} ha fatto ${score}/${total} in modalità ${modeLabel} su Linguo. Riuscirai a batterlo?`
}