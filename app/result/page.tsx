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
import { useAuth } from "@/components/auth-provider"

import { supabase } from "@/lib/supabase"
import { generateShareCode, type PlayerAnswer } from "@/lib/challenge"
import { type GameMode, getResultMessage } from "@/lib/game-mode"
import { getFamilyLabel, getRunStats } from "@/lib/run-stats"
import { trackEvent } from "@/lib/analytics"
import { saveGameSession } from "@/lib/game-sessions"
import { grantGameJourneyXp } from "@/lib/journey"

export default function ResultPage() {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement | null>(null)

  const { showToast } = useToast()
  const { t, locale } = useLocale()
  const { user } = useAuth()

  const [nickname, setNickname] = useState("")
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [mode, setMode] = useState<GameMode>("normal")
  const [answers, setAnswers] = useState<PlayerAnswer[]>([])
  const [questionIds, setQuestionIds] = useState<string[]>([])
  const [creatingChallenge, setCreatingChallenge] = useState(false)
  const [existingChallengeCode, setExistingChallengeCode] = useState<
    string | null
  >(null)
  const [challengeLink, setChallengeLink] = useState<string | null>(null)
  const [downloadingCard, setDownloadingCard] = useState(false)
  const [sessionSaved, setSessionSaved] = useState(false)
  const [journeyAwarded, setJourneyAwarded] = useState(false)

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
    setAnswers(JSON.parse(savedAnswers) as PlayerAnswer[])
    setQuestionIds(JSON.parse(savedQuestionIds) as string[])
    setExistingChallengeCode(savedChallengeCode)

    if (savedChallengeCode) {
      setChallengeLink(`${window.location.origin}/challenge/${savedChallengeCode}`)
    }

    if (
      savedMode === "normal" ||
      savedMode === "hard" ||
      savedMode === "similar"
    ) {
      setMode(savedMode)
    }
  }, [router])

  useEffect(() => {
    if (!nickname || total === 0) return

    trackEvent("game_complete", {
      mode,
      score,
      total,
      locale,
    })
  }, [nickname, score, total, mode, locale])

  const stats = getRunStats(answers)

  useEffect(() => {
    const saveSession = async () => {
      if (!user) return
      if (!nickname || total === 0) return
      if (sessionSaved) return

      try {
        await saveGameSession({
          userId: user.id,
          mode,
          score,
          totalQuestions: total,
          bestStreak: stats.bestStreak,
          answers,
        })

        setSessionSaved(true)

        if (!journeyAwarded) {
          const journeyResult = await grantGameJourneyXp({
            userId: user.id,
            mode,
            score,
            totalQuestions: total,
            bestStreak: stats.bestStreak,
            questionIds,
          })

          setJourneyAwarded(true)

          if (journeyResult.awarded) {
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
        }
      } catch (error) {
        console.error("Errore salvataggio game session:", error)
      }
    }

    void saveSession()
  }, [
    user,
    nickname,
    total,
    sessionSaved,
    journeyAwarded,
    mode,
    score,
    stats.bestStreak,
    answers,
    questionIds,
    locale,
    showToast,
  ])

  const handleReplay = () => {
    localStorage.removeItem("linguo_last_challenge_code")
    router.push("/play")
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const handleOpenChallengeStatus = () => {
    if (!existingChallengeCode) return

    trackEvent("challenge_status_opened", {
      code: existingChallengeCode,
      locale,
    })

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

  const copyChallengeLink = async (link: string, shareText?: string) => {
    try {
      await navigator.clipboard.writeText(shareText ? `${shareText} ${link}` : link)
      showToast(t("toast.copyChallenge"), "success")
    } catch (error) {
      console.error("Errore nella copia del link:", error)
      showToast(t("toast.copyError"), "error")
    }
  }

  const openShare = async (shareCode: string) => {
    const challengeUrl = `${window.location.origin}/challenge/${shareCode}`

    setChallengeLink(challengeUrl)

    const shareText = getShareText({
      locale,
      nickname,
      score,
      total,
      modeLabel: t(`mode.${mode}`),
    })

    await copyChallengeLink(challengeUrl, shareText)

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Linguo",
          text: shareText,
          url: challengeUrl,
        })
      } catch (error) {
        console.error("Condivisione annullata o fallita:", error)
      }
    }
  }

  const handleShare = async () => {
    if (creatingChallenge || answers.length === 0 || questionIds.length === 0) {
      showToast(t("toast.challengeCreateError"), "error")
      return
    }

    if (existingChallengeCode) {
      await openShare(existingChallengeCode)
      return
    }

    setCreatingChallenge(true)

    try {
      let shareCode = generateShareCode()

      const { data: existing, error: existingError } = await supabase
        .from("challenges")
        .select("id")
        .eq("share_code", shareCode)
        .maybeSingle()

      if (existingError) {
        console.error("Errore controllo codice challenge:", existingError)
      }

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

      if (error) {
        console.error("Errore creazione challenge:", error)
        showToast(t("toast.challengeCreateError"), "error")
        return
      }

      trackEvent("challenge_created", {
        mode,
        score,
        total,
        locale,
      })

      localStorage.setItem("linguo_last_challenge_code", shareCode)
      setExistingChallengeCode(shareCode)

      await openShare(shareCode)
    } catch (error) {
      console.error("Errore imprevisto creazione challenge:", error)
      showToast(t("toast.challengeCreateError"), "error")
    } finally {
      setCreatingChallenge(false)
    }
  }

  const resultMessage = getResultMessage(mode, score, total, locale)

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="rounded-[36px] border border-white/10 bg-black/40 p-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                {t("result.title")}
              </p>

              <div className="mt-4 inline-flex rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-green-300">
                {t(`mode.${mode}`)}
              </div>

              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white">
                {nickname}
              </h1>

              <p className="mt-4 text-6xl font-semibold text-green-400">
                {score}/{total}
              </p>

              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-zinc-400">
                {resultMessage}
              </p>

              <div className="mt-7 grid grid-cols-3 gap-3">
                <ResultStat
                  label={t("result.bestStreak")}
                  value={stats.bestStreak}
                />

                <ResultStat
                  label={t("result.nonLatin")}
                  value={stats.nonLatinCorrect}
                />

                <ResultStat
                  label={t("result.bestFamily")}
                  value={
                    stats.bestFamily
                      ? `${getFamilyLabel(stats.bestFamily.key, locale)} ${stats.bestFamily.correct}/${stats.bestFamily.total}`
                      : t("result.noData")
                  }
                />
              </div>

              <div className="mt-7 space-y-3">
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
                  <Button
                    key={item.key}
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={item.className}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              {challengeLink ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-left">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {locale === "en"
                      ? "Challenge link created:"
                      : "Link sfida creato:"}
                  </p>

                  <input
                    readOnly
                    value={challengeLink}
                    onFocus={(event) => event.currentTarget.select()}
                    className="mt-3 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white outline-none transition focus:border-green-500"
                  />

                  <Button
                    onClick={() => copyChallengeLink(challengeLink)}
                    className="mt-3 h-11 w-full rounded-xl bg-green-500 text-sm font-medium text-black transition hover:bg-green-400"
                  >
                    {locale === "en" ? "Copy link" : "Copia link"}
                  </Button>
                </div>
              ) : null}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
          >
            <div ref={cardRef}>
              <ResultShareCard
                nickname={nickname}
                score={score}
                total={total}
                modeLabel={t(`mode.${mode}`)}
                resultMessage={resultMessage}
                bestStreak={stats.bestStreak}
                nonLatinCorrect={stats.nonLatinCorrect}
                bestFamily={
                  stats.bestFamily
                    ? {
                        label: getFamilyLabel(stats.bestFamily.key, locale),
                        correct: stats.bestFamily.correct,
                        total: stats.bestFamily.total,
                      }
                    : null
                }
                locale={locale}
              />
            </div>

            <div className="mt-6">
              <AdSenseBanner slot="5675946231" className="min-h-24" />
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}

function ResultStat({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>

      <p className="mt-2 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

function getShareText({
  locale,
  nickname,
  score,
  total,
  modeLabel,
}: {
  locale: "it" | "en"
  nickname: string
  score: number
  total: number
  modeLabel: string
}) {
  if (locale === "en") {
    return `${nickname} scored ${score}/${total} in ${modeLabel} on Linguo. Can you beat them?`
  }

  return `${nickname} ha fatto ${score}/${total} in modalità ${modeLabel} su Linguo. Riuscirai a batterlo?`
}