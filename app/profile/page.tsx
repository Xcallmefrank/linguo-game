"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Bar,
  BarChart,
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
import { getLocalDateKey } from "@/lib/daily"
import {
  calculateDailyStreak,
  getMyRecentDailyAttempts,
  type DailyAttempt,
} from "@/lib/daily-sessions"
import {
  getMyGameModeStats,
  getMyGameOverviewStats,
  getMyRecentGameSessions,
  type GameModeStats,
  type GameOverviewStats,
  type GameSession,
} from "@/lib/game-sessions"
import { getMyProfile, type Profile } from "@/lib/profile"
import {
  getActiveRankedSeason,
  getMyRankedStanding,
  type RankedSeason,
  type RankedStanding,
} from "@/lib/ranked-v2"

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

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function addDays(key: string, amount: number) {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + amount)
  return toDateKey(date)
}

function formatDate(value: string, locale: "it" | "en") {
  return new Date(value).toLocaleDateString(locale === "en" ? "en-US" : "it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function calculateBestDailyStreak(attempts: DailyAttempt[]) {
  if (attempts.length === 0) return 0

  const keys = Array.from(new Set(attempts.map((attempt) => attempt.daily_key)))
    .sort((a, b) => a.localeCompare(b))

  let best = 0
  let current = 0
  let previous: string | null = null

  for (const key of keys) {
    if (previous && key === addDays(previous, 1)) {
      current += 1
    } else {
      current = 1
    }

    best = Math.max(best, current)
    previous = key
  }

  return best
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t, locale } = useLocale()

  const [gateState, setGateState] = useState<GateState>("checking-auth")
  const [profile, setProfile] = useState<Profile | null>(null)
  const [season, setSeason] = useState<RankedSeason | null>(null)
  const [standing, setStanding] = useState<RankedStanding | null>(null)
  const [overview, setOverview] = useState<GameOverviewStats | null>(null)
  const [modeStats, setModeStats] = useState<GameModeStats[]>([])
  const [recentSessions, setRecentSessions] = useState<GameSession[]>([])
  const [dailyAttempts, setDailyAttempts] = useState<DailyAttempt[]>([])

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

        const [myStanding, gameOverview, perMode, sessions, daily] =
          await Promise.all([
            getMyRankedStanding(activeSeason.id, user.id),
            getMyGameOverviewStats(user.id),
            getMyGameModeStats(user.id),
            getMyRecentGameSessions(user.id, 8),
            getMyRecentDailyAttempts(user.id, 90),
          ])

        if (cancelled) return

        setProfile(myProfile)
        setSeason(activeSeason)
        setStanding(myStanding)
        setOverview(gameOverview)
        setModeStats(perMode)
        setRecentSessions(sessions)
        setDailyAttempts(daily)
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

  const todayKey = getLocalDateKey()
  const dailyStreak = calculateDailyStreak(dailyAttempts, todayKey)
  const bestDailyStreak = calculateBestDailyStreak(dailyAttempts)
  const todayDaily = dailyAttempts.find((attempt) => attempt.daily_key === todayKey)
  const lastDaily = dailyAttempts[0] ?? null
  const dailyCompleted = dailyAttempts.length
  const perfectDailyCount = dailyAttempts.filter(
    (attempt) => attempt.score === attempt.total_questions
  ).length

  if (authLoading || gateState !== "ready") {
    return (
      <main className="min-h-screen px-5 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              {t("profile.title")}
            </p>

            <h1 className="mt-4 text-2xl font-semibold text-white">
              {authLoading && t("auth.checkingSession")}
              {!authLoading && gateState === "checking-auth" && t("auth.checkingAccess")}
              {!authLoading && gateState === "signing-in" && t("auth.goingToGoogle")}
              {!authLoading && gateState === "checking-profile" && t("ranked.checkingProfile")}
              {!authLoading && gateState === "loading-profile" && t("profile.loading")}
              {!authLoading && gateState === "error" && t("ranked.problemLoading")}
            </h1>

            {gateState === "error" ? (
              <Button
                onClick={() => router.push("/")}
                className="mt-6 h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
              >
                {t("common.backHome")}
              </Button>
            ) : null}
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="h-10 rounded-full border border-zinc-800 bg-black/30 px-4 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
          >
            ← {t("common.backHome")}
          </button>

          <div className="rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-green-300">
            {t("profile.title")}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.3fr]">
          <div className="space-y-5">
            <Card className="relative overflow-hidden rounded-[36px] border border-white/10 bg-black/40 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,197,94,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent)]" />

              <div className="relative">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {t("profile.title")}
                </p>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                  {profile?.nickname}
                </h1>

                <p className="mt-2 text-sm text-zinc-400">
                  {getFlagFromCode(profile?.country_code ?? "")}{" "}
                  {profile?.country_code}
                </p>

                <p className="mt-1 truncate text-sm text-zinc-500">
                  {user?.email}
                </p>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  <StatCard
                    label={t("profile.totalGames")}
                    value={overview?.totalGames ?? 0}
                  />

                  <StatCard
                    label={t("profile.averageAccuracy")}
                    value={`${overview?.averageAccuracy ?? 0}%`}
                  />

                  <StatCard
                    label={t("profile.bestScore")}
                    value={overview?.bestScore ?? 0}
                  />

                  <StatCard
                    label={t("profile.bestStreak")}
                    value={overview?.bestStreak ?? 0}
                  />
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden rounded-[36px] border border-green-500/15 bg-black/40 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(34,197,94,0.16),transparent_34%),radial-gradient(circle_at_90%_15%,rgba(250,204,21,0.08),transparent_30%)]" />

              <div className="relative space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-green-300">
                      Daily Word
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      {locale === "en" ? "Your daily path" : "Il tuo percorso daily"}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {locale === "en"
                        ? "One word a day. Build your streak and track your progress over time."
                        : "Una parola al giorno. Mantieni la serie e segui i tuoi progressi nel tempo."}
                    </p>
                  </div>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-3xl shadow-[0_0_28px_rgba(34,197,94,0.12)]">
                    🧭
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    label={locale === "en" ? "Current streak" : "Serie attuale"}
                    value={dailyStreak}
                    highlight
                  />

                  <StatCard
                    label={locale === "en" ? "Best streak" : "Miglior serie"}
                    value={bestDailyStreak}
                    highlight
                  />

                  <StatCard
                    label={locale === "en" ? "Completed" : "Completate"}
                    value={dailyCompleted}
                  />

                  <StatCard
                    label={locale === "en" ? "Perfect" : "Perfette"}
                    value={perfectDailyCount}
                  />
                </div>

                <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {locale === "en" ? "Today" : "Oggi"}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div>
                      <p
                        className={`text-lg font-semibold ${todayDaily ? "text-green-400" : "text-amber-300"
                          }`}
                      >
                        {todayDaily
                          ? locale === "en"
                            ? "Completed"
                            : "Completata"
                          : locale === "en"
                            ? "Still available"
                            : "Ancora disponibile"}
                      </p>

                      <p className="mt-1 text-sm text-zinc-400">
                        {todayDaily
                          ? `${todayDaily.score}/${todayDaily.total_questions}`
                          : locale === "en"
                            ? "Complete today’s challenge to keep your streak active."
                            : "Completa la sfida di oggi per mantenere attiva la tua serie."}
                      </p>
                    </div>

                    <Button
                      onClick={() => router.push("/daily")}
                      className="h-10 rounded-full bg-green-500 px-4 text-sm font-semibold text-black transition-all duration-200 hover:bg-green-400"
                    >
                      {todayDaily
                        ? locale === "en"
                          ? "Open"
                          : "Apri"
                        : locale === "en"
                          ? "Play"
                          : "Gioca"}
                    </Button>
                  </div>
                </div>

                {lastDaily ? (
                  <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {locale === "en" ? "Last daily" : "Ultima daily"}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-white">
                          {formatDate(lastDaily.created_at, locale)}
                        </p>

                        <p className="mt-1 text-sm text-zinc-400">
                          {lastDaily.daily_key}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-lg font-semibold text-green-300">
                        {lastDaily.score}/{lastDaily.total_questions}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>

            <Card className="rounded-[30px] border border-white/10 bg-black/40 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {t("ranked.title")}
                  </p>

                  <h2 className="mt-2 text-xl font-semibold text-white">
                    {season?.display_name ?? "--"}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    label={t("profile.runsCompleted")}
                    value={`${standing?.runs_completed ?? 0}/3`}
                  />

                  <StatCard
                    label={t("profile.averageScore")}
                    value={standing?.avg_score ?? "--"}
                  />

                  <StatCard
                    label={t("profile.averageTime")}
                    value={formatTime(standing?.avg_time_ms ?? null)}
                  />

                  <StatCard
                    label={t("profile.rankedStatus")}
                    value={
                      standing?.is_official
                        ? standing.position
                          ? `#${standing.position}`
                          : "OK"
                        : "..."
                    }
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
                  <p className="text-sm text-zinc-400">
                    {standing?.is_official
                      ? standing.position
                        ? `#${standing.position} / ${standing.total_ranked_users}`
                        : t("profile.officialAvailable")
                      : t("profile.completeThreeRuns")}
                  </p>
                </div>

                <Button
                  onClick={() => router.push("/ranked")}
                  className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
                >
                  {t("profile.goRanked")}
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="rounded-[30px] border border-white/10 bg-black/40 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-white">
                {t("profile.gamesByMode")}
              </h2>

              <div className="mt-4 h-64">
                {gamesByModeChart.some((item) => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gamesByModeChart}>
                      <defs>
                        <linearGradient
                          id="gamesByModeGreen"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#86efac" stopOpacity={0.95} />
                          <stop offset="45%" stopColor="#22c55e" stopOpacity={0.85} />
                          <stop offset="100%" stopColor="#052e16" stopOpacity={0.75} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(34,197,94,0.16)"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="name"
                        stroke="#a1a1aa"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: "rgba(255,255,255,0.18)" }}
                      />

                      <YAxis
                        stroke="#a1a1aa"
                        fontSize={12}
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={{ stroke: "rgba(255,255,255,0.18)" }}
                      />

                      <Tooltip
                        cursor={{ fill: "rgba(34,197,94,0.06)" }}
                        formatter={(value) => [
                          `${value}`,
                          locale === "en" ? "Games" : "Partite",
                        ]}
                        contentStyle={{
                          background: "rgba(9, 9, 11, 0.92)",
                          border: "1px solid rgba(34,197,94,0.22)",
                          borderRadius: "14px",
                          color: "#f4f4f5",
                        }}
                        labelStyle={{
                          color: "#86efac",
                        }}
                      />

                      <Bar
                        dataKey="value"
                        fill="url(#gamesByModeGreen)"
                        stroke="#22c55e"
                        strokeWidth={1}
                        radius={[10, 10, 4, 4] as [
                          number,
                          number,
                          number,
                          number,
                        ]}
                        barSize={42}
                        background={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/70 text-sm text-zinc-500">
                    {t("profile.noChartData")}
                  </div>
                )}
              </div>
            </Card>

            <Card className="rounded-[30px] border border-white/10 bg-black/40 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-white">
                {t("profile.avgAccuracyByMode")}
              </h2>

              <div className="mt-4 h-64">
                {accuracyByModeChart.some((item) => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accuracyByModeChart}>
                      <defs>
                        <linearGradient
                          id="accuracyByModeGreen"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#bbf7d0" stopOpacity={0.98} />
                          <stop offset="45%" stopColor="#22c55e" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#064e3b" stopOpacity={0.78} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(34,197,94,0.16)"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="name"
                        stroke="#a1a1aa"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: "rgba(255,255,255,0.18)" }}
                      />

                      <YAxis
                        stroke="#a1a1aa"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: "rgba(255,255,255,0.18)" }}
                      />

                      <Tooltip
                        cursor={{ fill: "rgba(34,197,94,0.06)" }}
                        formatter={(value) => [
                          `${value}%`,
                          locale === "en" ? "Average accuracy" : "Accuracy media",
                        ]}
                        contentStyle={{
                          background: "rgba(9, 9, 11, 0.92)",
                          border: "1px solid rgba(34,197,94,0.22)",
                          borderRadius: "14px",
                          color: "#f4f4f5",
                        }}
                        labelStyle={{
                          color: "#86efac",
                        }}
                      />

                      <Bar
                        dataKey="value"
                        fill="url(#accuracyByModeGreen)"
                        stroke="#4ade80"
                        strokeWidth={1}
                        radius={[10, 10, 4, 4] as [
                          number,
                          number,
                          number,
                          number,
                        ]}
                        barSize={42}
                        background={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/70 text-sm text-zinc-500">
                    {t("profile.noChartData")}
                  </div>
                )}
              </div>
            </Card>

            <Card className="rounded-[30px] border border-white/10 bg-black/40 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-white">
                {t("profile.modeStats")}
              </h2>

              <div className="mt-4 grid gap-3">
                {modeStats.map((item) => (
                  <div
                    key={item.mode}
                    className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-white">
                        {modeLabel(item.mode)}
                      </p>

                      <p className="text-sm text-green-400">
                        {item.averageAccuracy}%
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-zinc-400">
                      <p>
                        {t("profile.totalGames")}:{" "}
                        <span className="text-zinc-200">{item.gamesPlayed}</span>
                      </p>

                      <p>
                        {t("profile.bestScore")}:{" "}
                        <span className="text-zinc-200">{item.bestScore}</span>
                      </p>

                      <p className="col-span-2">
                        {t("profile.averageTime")}:{" "}
                        <span className="text-zinc-200">
                          {formatTime(item.averageTimeMs)}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[30px] border border-white/10 bg-black/40 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-white">
                {t("profile.recentGames")}
              </h2>

              <div className="mt-4 space-y-3">
                {recentSessions.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-sm text-zinc-500">
                    {t("profile.noGamesYet")}
                  </div>
                ) : (
                  recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">
                            {modeLabel(session.mode)}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            {new Date(session.created_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-green-400">
                            {session.score}/{session.total_questions}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            {session.accuracy_percent}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

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

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${highlight
        ? "border-green-500/20 bg-green-500/10"
        : "border-white/10 bg-zinc-950/70"
        }`}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-semibold ${highlight ? "text-green-400" : "text-white"
          }`}
      >
        {value}
      </p>
    </div>
  )
}