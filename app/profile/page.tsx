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

import { Button } from "@/components/button"
import { Card } from "@/components/card"
import { useAuth } from "@/components/auth-provider"
import { useLocale } from "@/components/locale-provider"

import { signInWithGoogle, signOut } from "@/lib/auth"
import { getFlagFromCode } from "@/lib/countries"
import { getMyProfile, type Profile } from "@/lib/profile"
import {
  getActiveRankedSeason,
  getMyRankedStanding,
  type RankedSeason,
  type RankedStanding,
} from "@/lib/ranked-v2"
import {
  getMyGameModeStats,
  getMyGameOverviewStats,
  getMyRecentGameSessions,
  type GameModeStats,
  type GameOverviewStats,
  type GameSession,
} from "@/lib/game-sessions"
import {
  BADGE_DEFINITIONS,
  getLevelSnapshot,
  getMyJourney,
  type JourneyProgress,
  type JourneyXpEvent,
  type UserBadge,
} from "@/lib/journey"

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

function formatDate(date: string, locale: "it" | "en") {
  return new Date(date).toLocaleString(locale === "en" ? "en-US" : "it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
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
  const [journeyProgress, setJourneyProgress] =
    useState<JourneyProgress | null>(null)
  const [journeyBadges, setJourneyBadges] = useState<UserBadge[]>([])
  const [journeyEvents, setJourneyEvents] = useState<JourneyXpEvent[]>([])

  const isEnglish = locale === "en"

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

        const [myStanding, gameOverview, perMode, sessions, journey] =
          await Promise.all([
            getMyRankedStanding(activeSeason.id, user.id),
            getMyGameOverviewStats(user.id),
            getMyGameModeStats(user.id),
            getMyRecentGameSessions(user.id, 8),
            getMyJourney(user.id),
          ])

        if (cancelled) return

        setProfile(myProfile)
        setSeason(activeSeason)
        setStanding(myStanding)
        setOverview(gameOverview)
        setModeStats(perMode)
        setRecentSessions(sessions)
        setJourneyProgress(journey.progress)
        setJourneyBadges(journey.badges)
        setJourneyEvents(journey.events)
        setGateState("ready")
      } catch (error) {
        console.error("Errore caricamento profilo:", error)

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

  const journeySnapshot = useMemo(() => {
    return getLevelSnapshot(journeyProgress?.xp ?? 0, locale)
  }, [journeyProgress?.xp, locale])

  const unlockedBadgeIds = useMemo(() => {
    return new Set(journeyBadges.map((badge) => badge.badge_id))
  }, [journeyBadges])

  const latestBadge = useMemo(() => {
    const badgeId = journeyBadges[0]?.badge_id

    if (!badgeId) return null

    return BADGE_DEFINITIONS.find((badge) => badge.id === badgeId) ?? null
  }, [journeyBadges])

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
              {!authLoading &&
                gateState === "checking-auth" &&
                t("auth.checkingAccess")}
              {!authLoading &&
                gateState === "signing-in" &&
                t("auth.goingToGoogle")}
              {!authLoading &&
                gateState === "checking-profile" &&
                t("ranked.checkingProfile")}
              {!authLoading &&
                gateState === "loading-profile" &&
                t("profile.loading")}
              {!authLoading &&
                gateState === "error" &&
                t("ranked.problemLoading")}
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
      <div className="mx-auto max-w-6xl">
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

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="relative overflow-hidden rounded-[40px] border border-white/10 bg-black/40 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(34,197,94,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent)]" />

            <div className="relative">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] border border-green-500/20 bg-green-500/10 text-4xl shadow-[0_12px_35px_rgba(34,197,94,0.13)]">
                    {latestBadge?.icon ?? "👤"}
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-green-300">
                      {isEnglish ? "Player profile" : "Profilo giocatore"}
                    </p>

                    <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
                      {profile?.nickname}
                    </h1>

                    <p className="mt-2 text-sm text-zinc-400">
                      {getFlagFromCode(profile?.country_code ?? "")}{" "}
                      {profile?.country_code} · {user?.email}
                    </p>

                    <p className="mt-3 text-sm text-zinc-500">
                      {latestBadge
                        ? `${isEnglish ? "Latest badge" : "Ultimo badge"}: ${
                            latestBadge.title[locale]
                          }`
                        : isEnglish
                          ? "No badge unlocked yet."
                          : "Nessun badge sbloccato."}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-green-500/20 bg-green-500/[0.08] px-5 py-4 text-left sm:text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-green-300">
                    Journey
                  </p>

                  <p className="mt-2 text-3xl font-semibold text-white">
                    Lv. {journeySnapshot.level}
                  </p>

                  <p className="mt-1 text-sm text-zinc-400">
                    {journeySnapshot.title}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-[30px] border border-white/10 bg-zinc-950/70 p-5">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      XP
                    </p>

                    <p className="mt-1 text-sm text-zinc-400">
                      {journeySnapshot.xpIntoLevel}/
                      {journeySnapshot.nextLevelXp} XP
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {isEnglish ? "Next level" : "Prossimo livello"}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-green-300">
                      -{journeySnapshot.xpToNextLevel} XP
                    </p>
                  </div>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-300 transition-all duration-500"
                    style={{
                      width: `${journeySnapshot.progressPercent}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                <ProfileMetric
                  label={t("profile.totalGames")}
                  value={overview?.totalGames ?? 0}
                />
                <ProfileMetric
                  label={t("profile.averageAccuracy")}
                  value={`${overview?.averageAccuracy ?? 0}%`}
                />
                <ProfileMetric
                  label={t("profile.bestScore")}
                  value={overview?.bestScore ?? 0}
                />
                <ProfileMetric
                  label={t("profile.bestStreak")}
                  value={overview?.bestStreak ?? 0}
                />
              </div>
            </div>
          </Card>

          <Card className="rounded-[40px] border border-white/10 bg-black/40 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("ranked.title")}
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-white">
              {isEnglish ? "Current ranked status" : "Stato ranked attuale"}
            </h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <ProfileMetric
                label={t("profile.currentSeason")}
                value={season?.display_name ?? "--"}
              />
              <ProfileMetric
                label={t("profile.runsCompleted")}
                value={`${standing?.runs_completed ?? 0}/3`}
              />
              <ProfileMetric
                label={t("profile.averageScore")}
                value={standing?.avg_score ?? "--"}
              />
              <ProfileMetric
                label={t("profile.averageTime")}
                value={formatTime(standing?.avg_time_ms ?? null)}
              />
            </div>

            <div className="mt-5 rounded-[28px] border border-white/10 bg-zinc-950/70 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                {t("profile.rankedStatus")}
              </p>

              <p className="mt-3 text-lg font-semibold text-white">
                {standing?.is_official
                  ? standing.position
                    ? `#${standing.position} / ${standing.total_ranked_users}`
                    : t("profile.officialAvailable")
                  : t("profile.completeThreeRuns")}
              </p>
            </div>

            <Button
              onClick={() => router.push("/ranked")}
              className="mt-6 h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
            >
              {t("profile.goRanked")}
            </Button>
          </Card>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <ChartCard
            title={t("profile.gamesByMode")}
            emptyText={t("profile.noChartData")}
            data={gamesByModeChart}
            valueSuffix=""
            tooltipLabel={isEnglish ? "Games" : "Partite"}
          />

          <ChartCard
            title={t("profile.avgAccuracyByMode")}
            emptyText={t("profile.noChartData")}
            data={accuracyByModeChart}
            valueSuffix="%"
            tooltipLabel={
              isEnglish ? "Average accuracy" : "Accuracy media"
            }
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-[34px] border border-white/10 bg-black/40 p-6 shadow-[0_14px_42px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Badge
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-white">
              {isEnglish ? "Rewards and milestones" : "Premi e traguardi"}
            </h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {BADGE_DEFINITIONS.map((badge) => {
                const unlocked = unlockedBadgeIds.has(badge.id)

                return (
                  <div
                    key={badge.id}
                    className={`rounded-3xl border p-4 transition ${
                      unlocked
                        ? "border-green-500/25 bg-green-500/10"
                        : "border-white/10 bg-zinc-950/70 opacity-55"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-2xl">
                        {badge.icon}
                      </div>

                      <div>
                        <p
                          className={`font-semibold ${
                            unlocked ? "text-white" : "text-zinc-500"
                          }`}
                        >
                          {badge.title[locale]}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-zinc-400">
                          {badge.description[locale]}
                        </p>

                        <p
                          className={`mt-3 text-xs uppercase tracking-[0.16em] ${
                            unlocked ? "text-green-300" : "text-zinc-600"
                          }`}
                        >
                          {unlocked
                            ? isEnglish
                              ? "Unlocked"
                              : "Sbloccato"
                            : isEnglish
                              ? "Locked"
                              : "Bloccato"}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="rounded-[34px] border border-white/10 bg-black/40 p-6 shadow-[0_14px_42px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              XP
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-white">
              {isEnglish ? "Recent activity" : "Attività recente"}
            </h2>

            <div className="mt-6 space-y-3">
              {journeyEvents.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-sm text-zinc-500">
                  {isEnglish
                    ? "No XP events yet. Complete a game to start your Journey."
                    : "Nessun evento XP ancora. Completa una partita per iniziare il Journey."}
                </div>
              ) : (
                journeyEvents.slice(0, 8).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {event.source === "daily"
                            ? "Daily Word"
                            : event.source === "game"
                              ? isEnglish
                                ? "Quick Play"
                                : "Partita veloce"
                              : event.source}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {formatDate(event.created_at, locale)}
                        </p>
                      </div>

                      <p className="text-lg font-semibold text-green-300">
                        +{event.xp} XP
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[34px] border border-white/10 bg-black/40 p-6 shadow-[0_14px_42px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("profile.modeStats")}
            </p>

            <div className="mt-6 space-y-3">
              {modeStats.map((item) => (
                <div
                  key={item.mode}
                  className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">
                      {modeLabel(item.mode)}
                    </p>

                    <p className="text-sm font-medium text-green-300">
                      {item.averageAccuracy}%
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-zinc-400">
                    <p>
                      {t("profile.totalGames")}:{" "}
                      <span className="text-white">{item.gamesPlayed}</span>
                    </p>

                    <p>
                      {t("profile.bestScore")}:{" "}
                      <span className="text-white">{item.bestScore}</span>
                    </p>

                    <p>
                      {t("profile.averageTime")}:{" "}
                      <span className="text-white">
                        {formatTime(item.averageTimeMs)}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[34px] border border-white/10 bg-black/40 p-6 shadow-[0_14px_42px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {t("profile.recentGames")}
            </p>

            <div className="mt-6 space-y-3">
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
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">
                          {modeLabel(session.mode)}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {new Date(session.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-green-300">
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
        </section>

        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleLogout}
            className="h-12 rounded-2xl border border-red-500/20 bg-red-500/10 px-8 text-base font-medium text-red-300 transition-all duration-200 hover:bg-red-500/15"
          >
            {t("home.logout")}
          </Button>
        </div>
      </div>
    </main>
  )
}

function ProfileMetric({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>

      <p className="mt-2 truncate text-2xl font-semibold text-green-300">
        {value}
      </p>
    </div>
  )
}

function ChartCard({
  title,
  emptyText,
  data,
  valueSuffix,
  tooltipLabel,
}: {
  title: string
  emptyText: string
  data: {
    name: string
    value: number
  }[]
  valueSuffix: string
  tooltipLabel: string
}) {
  const hasData = data.some((item) => item.value > 0)

  return (
    <Card className="rounded-[34px] border border-white/10 bg-black/40 p-6 shadow-[0_14px_42px_rgba(0,0,0,0.42)] backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        {title}
      </p>

      <div className="mt-5 h-[260px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={{ stroke: "#3f3f46" }}
              />
              <YAxis
                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                axisLine={{ stroke: "#3f3f46" }}
                tickLine={{ stroke: "#3f3f46" }}
              />
              <Tooltip
                formatter={(value) => [
                  `${value}${valueSuffix}`,
                  tooltipLabel,
                ]}
                contentStyle={{
                  backgroundColor: "#09090b",
                  border: "1px solid #27272a",
                  borderRadius: "16px",
                  color: "#fff",
                }}
              />
              <Bar
                dataKey="value"
                fill="#22c55e"
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/70 text-sm text-zinc-500">
            {emptyText}
          </div>
        )}
      </div>
    </Card>
  )
}