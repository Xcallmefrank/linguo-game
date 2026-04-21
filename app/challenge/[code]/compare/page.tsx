"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { toPng } from "html-to-image"
import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { AdSenseBanner } from "@/components/adsense-banner"
import { CompareShareCard } from "@/components/compare-share-card"
import { useToast } from "@/components/toast-provider"
import { useLocale } from "@/components/locale-provider"
import { supabase } from "@/lib/supabase"
import { questions } from "@/lib/questions"
import { PlayerAnswer } from "@/lib/challenge"
import { GAME_MODE_LABELS } from "@/lib/game-mode"
import { getFamilyLabel, getRunStats } from "@/lib/run-stats"
import { getLanguageLabel } from "@/lib/language-labels"

type ChallengeRow = {
  id: string
  creator_name: string
  creator_score: number
  total_questions: number
  question_ids: number[]
  creator_answers: PlayerAnswer[]
  mode: "normal" | "hard" | "similar" | null
  share_code: string
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

function getModeKey(mode: "normal" | "hard" | "similar" | null) {
  return mode === "hard" || mode === "similar" ? mode : "normal"
}

export default function ComparePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement | null>(null)
  const { showToast } = useToast()
  const { locale, t } = useLocale()

  const [loading, setLoading] = useState(true)
  const [creator, setCreator] = useState<ChallengeRow | null>(null)
  const [opponent, setOpponent] = useState<AttemptRow | null>(null)
  const [waiting, setWaiting] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const [downloadingCard, setDownloadingCard] = useState(false)

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

      setCreator(challenge as ChallengeRow)

      const { data: attempt } = await supabase
        .from("challenge_attempts")
        .select("*")
        .eq("challenge_id", challenge.id)
        .maybeSingle()

      if (!attempt) {
        setOpponent(null)
        setWaiting(true)
        setLoading(false)
        return
      }

      setOpponent(attempt as AttemptRow)
      setWaiting(false)
      setLoading(false)
    }

    loadComparison()
  }, [params, router, refreshTick])

  useEffect(() => {
    if (!waiting) return

    const interval = setInterval(() => {
      setRefreshTick((prev) => prev + 1)
    }, 8000)

    return () => clearInterval(interval)
  }, [waiting])

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
        text: question?.text || "Question not found",
        correct: creatorAnswer?.correct || opponentAnswer?.correct || "",
        creatorAnswer,
        opponentAnswer,
      }
    })
  }, [creator, opponent])

  const winnerText = useMemo(() => {
    if (!creator || !opponent) return ""

    if (creator.creator_score === opponent.opponent_score) {
      return locale === "en"
        ? "A tie. Annoyingly balanced."
        : "Pareggio. Fastidiosamente equilibrato."
    }

    if (creator.creator_score > opponent.opponent_score) {
      return locale === "en"
        ? `${creator.creator_name} won`
        : `${creator.creator_name} ha vinto`
    }

    return locale === "en"
      ? `${opponent.opponent_name} won`
      : `${opponent.opponent_name} ha vinto`
  }, [creator, opponent, locale])

  const creatorStats = creator ? getRunStats(creator.creator_answers) : null
  const opponentStats = opponent ? getRunStats(opponent.opponent_answers) : null

  const handleGoHome = () => {
    router.push("/")
  }

  const handlePlayAgain = () => {
    localStorage.removeItem("linguo_last_challenge_code")
    router.push("/play")
  }

  const handleCopyInviteLink = async () => {
    if (!creator) return

    const inviteUrl = `${window.location.origin}/challenge/${creator.share_code}`

    try {
      await navigator.clipboard.writeText(inviteUrl)
      showToast(t("toast.copyLink"), "success")
    } catch (error) {
      console.error(error)
      showToast(t("toast.copyError"), "error")
    }
  }

  const handleDownloadCard = async () => {
    if (!cardRef.current || !creator || !opponent) return

    try {
      setDownloadingCard(true)

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#050505",
      })

      const link = document.createElement("a")
      link.download = `linguo-compare-${creator.creator_name}-vs-${opponent.opponent_name}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Errore download card compare:", error)
      showToast(t("toast.downloadError"), "error")
    } finally {
      setDownloadingCard(false)
    }
  }

  if (loading || !creator) return null

  if (waiting) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 py-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <Card className="rounded-[36px] border border-white/10 bg-black/40 p-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                    {t("compare.activeChallenge")}
                  </p>

                  <p className="text-sm text-green-400">
                    {t(`mode.${getModeKey(creator.mode)}`)}
                  </p>

                  <h1 className="text-3xl font-semibold tracking-tight">
                    {creator.creator_name} {creator.creator_score}/{creator.total_questions}
                  </h1>

                  <p className="text-zinc-400">{t("compare.waiting")}</p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-5">
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-400">Status</p>
                    <p className="text-lg font-medium text-white">
                      {t("compare.noOpponent")}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {t("compare.autoRefresh")}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleCopyInviteLink}
                    className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
                  >
                    {t("compare.copyLink")}
                  </Button>

                  <Button
                    onClick={() => setRefreshTick((prev) => prev + 1)}
                    className="h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-900 text-base font-medium text-white transition-all duration-200 hover:bg-zinc-800"
                  >
                    {t("compare.refreshNow")}
                  </Button>

                  <Button
                    onClick={handleGoHome}
                    className="h-12 w-full rounded-2xl border border-zinc-800 bg-transparent text-base font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
                  >
                    {t("common.backHome")}
                  </Button>
                </div>

                <AdSenseBanner slot="5204113456" className="min-h-36" />
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    )
  }

  if (!opponent) return null

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
                  {t("compare.title")}
                </p>

                <h1 className="text-3xl font-semibold tracking-tight">
                  {creator.creator_name} vs {opponent.opponent_name}
                </h1>

                <div className="space-y-1">
                  <p className="text-zinc-400">{winnerText}</p>
                  <p className="text-sm text-green-400">
                    {t(`mode.${getModeKey(creator.mode)}`)}
                  </p>
                </div>
              </div>

              <div ref={cardRef}>
                <CompareShareCard
                  creatorName={creator.creator_name}
                  creatorScore={creator.creator_score}
                  opponentName={opponent.opponent_name}
                  opponentScore={opponent.opponent_score}
                  total={creator.total_questions}
                  modeLabel={t(`mode.${getModeKey(creator.mode)}`)}
                  winnerText={winnerText}
                />
              </div>

              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-left">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {t("result.bestStreak")}
                    </p>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-400">{creator.creator_name}</span>
                        <span className="font-medium text-white">
                          {creatorStats?.bestStreak ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-400">{opponent.opponent_name}</span>
                        <span className="font-medium text-white">
                          {opponentStats?.bestStreak ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-left">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {t("result.nonLatin")}
                    </p>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-400">{creator.creator_name}</span>
                        <span className="font-medium text-white">
                          {creatorStats?.nonLatinCorrect ?? 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-zinc-400">{opponent.opponent_name}</span>
                        <span className="font-medium text-white">
                          {opponentStats?.nonLatinCorrect ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-left">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {t("result.bestFamily")}
                  </p>

                  <div className="mt-3 space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-zinc-400">{creator.creator_name}</span>
                      <span className="text-right text-white">
                        {creatorStats?.bestFamily
                          ? `${getFamilyLabel(creatorStats.bestFamily.key, locale)} · ${creatorStats.bestFamily.correct}/${creatorStats.bestFamily.total}`
                          : t("result.noData")}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <span className="text-zinc-400">{opponent.opponent_name}</span>
                      <span className="text-right text-white">
                        {opponentStats?.bestFamily
                          ? `${getFamilyLabel(opponentStats.bestFamily.key, locale)} · ${opponentStats.bestFamily.correct}/${opponentStats.bestFamily.total}`
                          : t("result.noData")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleDownloadCard}
                  disabled={downloadingCard}
                  className="h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-900 text-base font-medium text-white transition-all duration-200 hover:bg-zinc-800 disabled:opacity-60"
                >
                  {downloadingCard ? t("common.prepareCard") : t("common.downloadCard")}
                </Button>

                <Button
                  onClick={handlePlayAgain}
                  className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
                >
                  {t("common.newGame")}
                </Button>

                <Button
                  onClick={handleGoHome}
                  className="h-12 w-full rounded-2xl border border-zinc-800 bg-transparent text-base font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
                >
                  {t("common.backHome")}
                </Button>
              </div>

              <AdSenseBanner slot="5204113456" className="min-h-36" />
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
                      {t("quiz.question")} {index + 1}
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
                          className={`font-medium ${
                            row.creatorAnswer?.isCorrect
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {row.creatorAnswer?.isCorrect
                            ? t("compare.correct")
                            : t("compare.wrong")}
                        </p>
                      </div>
                      <p className="mt-2 font-medium text-white">
                        {row.creatorAnswer?.selected
                          ? getLanguageLabel(row.creatorAnswer.selected, locale)
                          : ""}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-zinc-950/70 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-zinc-400">{opponent.opponent_name}</p>
                        <p
                          className={`font-medium ${
                            row.opponentAnswer?.isCorrect
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {row.opponentAnswer?.isCorrect
                            ? t("compare.correct")
                            : t("compare.wrong")}
                        </p>
                      </div>
                      <p className="mt-2 font-medium text-white">
                        {row.opponentAnswer?.selected
                          ? getLanguageLabel(row.opponentAnswer.selected, locale)
                          : ""}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3">
                      <p className="text-zinc-400">{t("compare.correctAnswer")}</p>
                      <p className="mt-2 font-medium text-green-400">
                        {getLanguageLabel(row.correct, locale)}
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