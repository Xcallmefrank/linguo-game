"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { AdSenseBanner } from "@/components/adsense-banner"
import { useLocale } from "@/components/locale-provider"
import { useToast } from "@/components/toast-provider"
import { useAuth } from "@/components/auth-provider"
import { signInWithGoogle } from "@/lib/auth"
import { getMyProfile } from "@/lib/profile"
import { getFlagFromCode } from "@/lib/countries"
import {
  getActiveRankedSeason,
  getMyRankedStanding,
  getNextRunNumber,
  getRankedLeaderboard,
  type RankedLeaderboardEntry,
  type RankedSeason,
  type RankedStanding,
} from "@/lib/ranked-v2"

type GateState =
  | "checking-auth"
  | "signing-in"
  | "checking-profile"
  | "loading-ranked"
  | "ready"
  | "error"

function formatRemaining(endDate: string, locale: "it" | "en") {
  const end = new Date(endDate).getTime()
  const now = Date.now()
  const diff = Math.max(0, end - now)

  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (locale === "en") {
    return `${days}d ${hours}h ${minutes}m`
  }

  return `${days}g ${hours}h ${minutes}m`
}

function formatTime(ms: number | null) {
  if (ms === null) return "--"
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export default function RankedPage() {
  const router = useRouter()
  const { locale, t } = useLocale()
  const { showToast } = useToast()
  const { user, loading: authLoading } = useAuth()

  const [gateState, setGateState] = useState<GateState>("checking-auth")
  const [season, setSeason] = useState<RankedSeason | null>(null)
  const [leaderboard, setLeaderboard] = useState<RankedLeaderboardEntry[]>([])
  const [standing, setStanding] = useState<RankedStanding | null>(null)
  const [nextRunNumber, setNextRunNumber] = useState<number | null>(null)
  const [profileNickname, setProfileNickname] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadRanked = async () => {
      try {
        if (authLoading) {
          setGateState("checking-auth")
          return
        }

        if (!user) {
          setGateState("signing-in")
          await signInWithGoogle()
          return
        }

        setGateState("checking-profile")
        const profile = await getMyProfile(user.id)

        if (cancelled) return

        if (!profile) {
          router.replace("/complete-profile")
          return
        }

        setProfileNickname(profile.nickname)
        setGateState("loading-ranked")

        const currentSeason = await getActiveRankedSeason()
        const [board, myStanding, nextRun] = await Promise.all([
          getRankedLeaderboard(currentSeason.id),
          getMyRankedStanding(currentSeason.id, user.id),
          getNextRunNumber(currentSeason.id, user.id),
        ])

        if (cancelled) return

        setSeason(currentSeason)
        setLeaderboard(board)
        setStanding(myStanding)
        setNextRunNumber(nextRun)
        setGateState("ready")
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setGateState("error")
          showToast(t("toast.rankedLoadError"), "error")
        }
      }
    }

    void loadRanked()

    return () => {
      cancelled = true
    }
  }, [authLoading, user, router, t, showToast])

  const countdown = useMemo(() => {
    if (!season) return "--"
    return formatRemaining(season.ends_at, locale)
  }, [season, locale, tick])

  const handleStartRun = () => {
    if (!nextRunNumber) return
    router.push("/ranked/play")
  }

  if (authLoading || gateState !== "ready") {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 py-8">
          <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                {t("ranked.title")}
              </p>
              <p className="text-base text-zinc-300">
                {authLoading && t("auth.checkingSession")}
                {!authLoading && gateState === "checking-auth" && t("auth.checkingAccess")}
                {!authLoading && gateState === "signing-in" && t("auth.goingToGoogle")}
                {!authLoading &&
                  gateState === "checking-profile" &&
                  t("ranked.checkingProfile")}
                {!authLoading &&
                  gateState === "loading-ranked" &&
                  t("ranked.loadingSeason")}
                {!authLoading &&
                  gateState === "error" &&
                  t("ranked.problemLoading")}
              </p>

              {gateState === "error" ? (
                <Button
                  onClick={() => router.push("/")}
                  className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
                >
                  {t("common.backHome")}
                </Button>
              ) : null}
            </div>
          </Card>
        </div>
      </main>
    )
  }

  const official = Boolean(standing?.is_official)
  const runLabel =
    nextRunNumber === null
      ? t("ranked.allRunsCompleted")
      : `${t("ranked.playRun")} ${nextRunNumber}/3`

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-md px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-5"
        >
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/"
              }}
              className="h-10 rounded-full border border-zinc-800 bg-black/30 px-4 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
            >
              ← {t("common.backHome")}
            </button>
          </div>

          <Card className="rounded-[36px] border border-white/10 bg-black/40 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                  {t("ranked.title")}
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  {season?.display_name}
                </h1>
                <p className="text-sm leading-6 text-zinc-400">
                  {t("ranked.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-left">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {t("ranked.player")}
                  </p>
                  <p className="mt-2 truncate text-sm font-medium text-white">
                    {profileNickname ?? "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-left">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {t("ranked.endsIn")}
                  </p>
                  <p className="mt-2 text-sm font-medium text-green-400">
                    {countdown}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-left">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {t("profile.runsCompleted")}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {standing?.runs_completed ?? 0}/3
                    </p>
                  </div>

                  <div className="text-left">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {t("ranked.state")}
                    </p>
                    <p className="mt-2 text-sm font-medium text-green-400">
                      {official
                        ? t("ranked.officialLeaderboard")
                        : t("ranked.provisionalAverage")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-black/30 p-3 text-left">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      {t("profile.averageScore")}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {standing?.avg_score ?? "--"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/30 p-3 text-left">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      {t("profile.averageAccuracy")}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {standing?.avg_accuracy ?? "--"}%
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/30 p-3 text-left">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      {t("profile.averageTime")}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatTime(standing?.avg_time_ms ?? null)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-green-500/15 bg-green-500/8 p-4 text-left">
                  {official ? (
                    <>
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        {t("ranked.officialPosition")}
                      </p>
                      <p className="mt-2 text-xl font-semibold text-green-400">
                        {standing?.position
                          ? `#${standing.position} / ${standing.total_ranked_users}`
                          : "—"}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        {t("ranked.accessLeaderboard")}
                      </p>
                      <p className="mt-2 text-sm text-zinc-300">
                        {t("profile.completeThreeRuns")}
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-4">
                  <Button
                    onClick={handleStartRun}
                    disabled={nextRunNumber === null}
                    className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400 disabled:bg-zinc-800 disabled:text-zinc-500"
                  >
                    {runLabel}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <AdSenseBanner slot="6447593116" className="min-h-24" />

          <Card className="rounded-[30px] border border-white/10 bg-black/40 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                  {t("ranked.topOfficial")}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {t("ranked.topOfficialHint")}
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
                      key={entry.user_id}
                      className="grid grid-cols-[40px_1fr_auto_auto] items-center gap-3 rounded-2xl bg-zinc-950/70 px-3 py-3"
                    >
                      <p className="text-sm text-zinc-500">#{index + 1}</p>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">
                          {getFlagFromCode(entry.country_code)} {entry.nickname}
                        </p>
                      </div>

                      <p className="text-sm text-green-400">
                        {entry.avg_score.toFixed(2)}
                      </p>

                      <p className="text-sm text-zinc-400">
                        {formatTime(entry.avg_time_ms)}
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