"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { useAuth } from "@/components/auth-provider"
import { useLocale } from "@/components/locale-provider"
import { signInWithGoogle, signOut } from "@/lib/auth"
import { getFlagFromCode } from "@/lib/countries"
import { getMyProfile } from "@/lib/profile"
import { getActiveRankedSeason, getMyRankedStanding } from "@/lib/ranked-v2"
import {
  getMyGameModeStats,
  getMyGameOverviewStats,
  getMyRecentGameSessions,
  type GameModeStats,
  type GameOverviewStats,
  type GameSession,
} from "@/lib/game-sessions"

type GateState =
  | "checking-auth"
  | "signing-in"
  | "checking-profile"
  | "loading-profile"
  | "ready"
  | "error"

function formatTime(ms: number | null) {
  if (ms === null) return "--"
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t, locale } = useLocale()

  const [gateState, setGateState] = useState<GateState>("checking-auth")
  const [profile, setProfile] = useState<any>(null)
  const [season, setSeason] = useState<any>(null)
  const [standing, setStanding] = useState<any>(null)
  const [overview, setOverview] = useState<GameOverviewStats | null>(null)
  const [modeStats, setModeStats] = useState<GameModeStats[]>([])
  const [recentSessions, setRecentSessions] = useState<GameSession[]>([])

  useEffect(() => {
    let cancelled = false

    const loadProfilePage = async () => {
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
        const myProfile = await getMyProfile(user.id)

        if (cancelled) return

        if (!myProfile) {
          router.replace("/complete-profile")
          return
        }

        setGateState("loading-profile")

        const activeSeason = await getActiveRankedSeason()
        const [myStanding, gameOverview, perMode, sessions] = await Promise.all([
          getMyRankedStanding(activeSeason.id, user.id),
          getMyGameOverviewStats(user.id),
          getMyGameModeStats(user.id),
          getMyRecentGameSessions(user.id, 8),
        ])

        if (cancelled) return

        setProfile(myProfile)
        setSeason(activeSeason)
        setStanding(myStanding)
        setOverview(gameOverview)
        setModeStats(perMode)
        setRecentSessions(sessions)
        setGateState("ready")
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setGateState("error")
        }
      }
    }

    void loadProfilePage()

    return () => {
      cancelled = true
    }
  }, [authLoading, user, router])

  const handleLogout = async () => {
    try {
      await signOut()
      router.replace("/")
    } catch (error) {
      console.error("Errore logout:", error)
    }
  }

  const modeLabel = (mode: string) => t(`mode.${mode}`)

  const gamesByModeChart = useMemo(() => {
    return modeStats.map((item) => ({
      name: modeLabel(item.mode),
      value: item.gamesPlayed,
    }))
  }, [modeStats])

  const accuracyByModeChart = useMemo(() => {
    return modeStats.map((item) => ({
      name: modeLabel(item.mode),
      value: item.averageAccuracy,
    }))
  }, [modeStats])

  if (authLoading || gateState !== "ready") {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 py-8">
          <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                {t("profile.title")}
              </p>
              <p className="text-base text-zinc-300">
                {authLoading && t("auth.checkingSession")}
                {!authLoading && gateState === "checking-auth" && t("auth.checkingAccess")}
                {!authLoading && gateState === "signing-in" && t("auth.goingToGoogle")}
                {!authLoading && gateState === "checking-profile" && t("ranked.checkingProfile")}
                {!authLoading && gateState === "loading-profile" && t("profile.loading")}
                {!authLoading && gateState === "error" && t("ranked.problemLoading")}
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

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-5 py-8">
        <div className="space-y-5">
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
                  {t("profile.title")}
                </p>
                <h1 className="text-4xl font-semibold tracking-tight text-white">
                  {profile?.nickname}
                </h1>
                <p className="text-sm text-zinc-400">
                  {getFlagFromCode(profile?.country_code ?? "")} {profile?.country_code}
                </p>
                <p className="text-sm text-zinc-500">{user?.email}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {t("profile.totalGames")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-green-400">
                    {overview?.totalGames ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {t("profile.averageAccuracy")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-green-400">
                    {overview?.averageAccuracy ?? 0}%
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {t("profile.bestScore")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-green-400">
                    {overview?.bestScore ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {t("profile.bestStreak")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-green-400">
                    {overview?.bestStreak ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="rounded-[30px] border border-white/10 bg-black/40 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                  {t("profile.gamesByMode")}
                </p>

                <div className="w-full min-w-0">
                  {gamesByModeChart.some((item) => item.value > 0) ? (
                    <div className="h-64 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={gamesByModeChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
                          <YAxis stroke="#a1a1aa" fontSize={12} allowDecimals={false} />
                          <Tooltip
                            formatter={(value) => [
                              `${value}`,
                              locale === "en" ? "Games" : "Partite",
                            ]}
                            contentStyle={{
                              backgroundColor: "#09090b",
                              border: "1px solid #27272a",
                              borderRadius: "16px",
                              color: "#fff",
                            }}
                          />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/70 text-sm text-zinc-500">
                      {t("profile.noChartData")}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="rounded-[30px] border border-white/10 bg-black/40 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                  {t("profile.avgAccuracyByMode")}
                </p>

                <div className="w-full min-w-0">
                  {accuracyByModeChart.some((item) => item.value > 0) ? (
                    <div className="h-64 w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={accuracyByModeChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
                          <YAxis stroke="#a1a1aa" fontSize={12} />
                          <Tooltip
                            formatter={(value) => [
                              `${value}%`,
                              locale === "en" ? "Average accuracy" : "Accuracy media",
                            ]}
                            contentStyle={{
                              backgroundColor: "#09090b",
                              border: "1px solid #27272a",
                              borderRadius: "16px",
                              color: "#fff",
                            }}
                          />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/70 text-sm text-zinc-500">
                      {t("profile.noChartData")}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <Card className="rounded-[30px] border border-white/10 bg-black/40 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                {t("profile.modeStats")}
              </p>

              <div className="grid gap-3 md:grid-cols-3">
                {modeStats.map((item) => (
                  <div
                    key={item.mode}
                    className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4"
                  >
                    <p className="text-sm font-semibold text-white">
                      {modeLabel(item.mode)}
                    </p>

                    <div className="mt-3 space-y-2 text-sm text-zinc-300">
                      <p>
                        {t("profile.totalGames")}:{" "}
                        <span className="font-semibold text-white">
                          {item.gamesPlayed}
                        </span>
                      </p>
                      <p>
                        {t("profile.bestScore")}:{" "}
                        <span className="font-semibold text-white">
                          {item.bestScore}
                        </span>
                      </p>
                      <p>
                        {t("profile.averageAccuracy")}:{" "}
                        <span className="font-semibold text-white">
                          {item.averageAccuracy}%
                        </span>
                      </p>
                      <p>
                        {t("profile.averageTime")}:{" "}
                        <span className="font-semibold text-white">
                          {formatTime(item.averageTimeMs)}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="rounded-[30px] border border-white/10 bg-black/40 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                {t("ranked.title")}
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {t("profile.currentSeason")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {season?.display_name ?? "--"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {t("profile.runsCompleted")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-green-400">
                    {standing?.runs_completed ?? 0}/3
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {t("profile.averageScore")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {standing?.avg_score ?? "--"}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {t("profile.averageTime")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatTime(standing?.avg_time_ms ?? null)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-green-500/15 bg-green-500/8 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  {t("profile.rankedStatus")}
                </p>

                {standing?.is_official ? (
                  <p className="mt-2 text-lg font-semibold text-green-400">
                    {standing.position
                      ? `#${standing.position} / ${standing.total_ranked_users}`
                      : t("profile.officialAvailable")}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-zinc-300">
                    {t("profile.completeThreeRuns")}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="rounded-[30px] border border-white/10 bg-black/40 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                {t("profile.recentGames")}
              </p>

              {recentSessions.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  {t("profile.noGamesYet")}
                </p>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-2xl bg-zinc-950/70 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-white">
                          {modeLabel(session.mode)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(session.created_at).toLocaleString()}
                        </p>
                      </div>

                      <p className="text-sm text-green-400">
                        {session.score}/{session.total_questions}
                      </p>

                      <p className="text-sm text-zinc-400">
                        {session.accuracy_percent}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <div className="grid gap-3 md:grid-cols-2">
            <Button
              onClick={() => {
                window.location.href = "/ranked"
              }}
              className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
            >
              {t("profile.goRanked")}
            </Button>

            <Button
              onClick={handleLogout}
              className="h-12 w-full rounded-2xl border border-zinc-800 bg-transparent text-base font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
            >
              {t("home.logout")}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}