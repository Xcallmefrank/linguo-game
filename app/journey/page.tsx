"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"

import { Button } from "@/components/button"
import { Card } from "@/components/card"
import { useAuth } from "@/components/auth-provider"
import { useLocale } from "@/components/locale-provider"
import { signInWithGoogle } from "@/lib/auth"
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
  | "loading"
  | "ready"
  | "error"

export default function JourneyPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { locale } = useLocale()

  const [gateState, setGateState] = useState<GateState>("checking-auth")
  const [progress, setProgress] = useState<JourneyProgress | null>(null)
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [events, setEvents] = useState<JourneyXpEvent[]>([])

  const isEnglish = locale === "en"

  useEffect(() => {
    let cancelled = false

    const loadJourney = async () => {
      try {
        if (authLoading) {
          setGateState("checking-auth")
          return
        }

        if (!user) {
          setGateState("signing-in")

          window.localStorage.setItem("linguo_after_login", "/journey")
          window.localStorage.setItem("linguo_after_profile", "/journey")

          await signInWithGoogle()
          return
        }

        setGateState("loading")

        const journey = await getMyJourney(user.id)

        if (cancelled) return

        setProgress(journey.progress)
        setBadges(journey.badges)
        setEvents(journey.events)
        setGateState("ready")
      } catch (error) {
        console.error("Errore caricamento Journey:", error)

        if (!cancelled) {
          setGateState("error")
        }
      }
    }

    void loadJourney()

    return () => {
      cancelled = true
    }
  }, [authLoading, user])

  const snapshot = useMemo(() => {
    return getLevelSnapshot(progress?.xp ?? 0, locale)
  }, [progress?.xp, locale])

  const unlockedBadgeIds = useMemo(() => {
    return new Set(badges.map((badge) => badge.badge_id))
  }, [badges])

  if (authLoading || gateState !== "ready") {
    return (
      <main className="min-h-screen px-5 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Journey
            </p>

            <h1 className="mt-4 text-2xl font-semibold text-white">
              {gateState === "signing-in"
                ? isEnglish
                  ? "Taking you to Google sign-in..."
                  : "Ti porto al login Google..."
                : gateState === "error"
                  ? isEnglish
                    ? "Something went wrong."
                    : "Qualcosa è andato storto."
                  : isEnglish
                    ? "Loading your progress..."
                    : "Carico i tuoi progressi..."}
            </h1>

            {gateState === "error" ? (
              <Button
                onClick={() => router.push("/")}
                className="mt-6 h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
              >
                {isEnglish ? "Back home" : "Torna alla home"}
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
            ← {isEnglish ? "Back home" : "Torna alla home"}
          </button>

          <div className="rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-green-300">
            Journey
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="relative overflow-hidden rounded-[40px] border border-white/10 bg-black/40 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(34,197,94,0.16),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(250,204,21,0.09),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent)]" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-green-300">
                  {isEnglish ? "Your progression" : "La tua progressione"}
                </p>

                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-6xl">
                  Journey
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
                  {isEnglish
                    ? "Earn XP, increase your level and unlock badges by completing Linguo activities."
                    : "Guadagna XP, aumenta di livello e sblocca badge completando le attività di Linguo."}
                </p>

                <div className="mt-8 rounded-[30px] border border-green-500/20 bg-green-500/10 p-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-green-300">
                        {isEnglish ? "Current level" : "Livello attuale"}
                      </p>

                      <p className="mt-2 text-4xl font-semibold text-white">
                        {snapshot.level}
                      </p>

                      <p className="mt-1 text-sm text-zinc-400">
                        {snapshot.title}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        XP
                      </p>

                      <p className="mt-2 text-2xl font-semibold text-green-300">
                        {snapshot.xp}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                      <span>
                        {snapshot.xpIntoLevel}/{snapshot.nextLevelXp} XP
                      </span>

                      <span>
                        {isEnglish ? "Next level" : "Prossimo livello"}:{" "}
                        {snapshot.xpToNextLevel} XP
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-zinc-900">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-300 transition-all duration-500"
                        style={{
                          width: `${snapshot.progressPercent}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <JourneyStat
                  label={isEnglish ? "Unlocked badges" : "Badge sbloccati"}
                  value={`${badges.length}/${BADGE_DEFINITIONS.length}`}
                />

                <JourneyStat
                  label={isEnglish ? "Recent XP events" : "Eventi XP recenti"}
                  value={events.length}
                />

                <JourneyStat
                  label={isEnglish ? "Growth rule" : "Regola crescita"}
                  value="+10%"
                />
              </div>
            </div>
          </Card>
        </motion.section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
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
              {events.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-sm text-zinc-500">
                  {isEnglish
                    ? "No XP events yet. Complete a Daily Word to start your Journey."
                    : "Nessun evento XP ancora. Completa una Daily Word per iniziare il Journey."}
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {event.source === "daily"
                            ? "Daily Word"
                            : event.source}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {new Date(event.created_at).toLocaleString(
                            isEnglish ? "en-US" : "it-IT"
                          )}
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
      </div>
    </main>
  )
}

function JourneyStat({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-zinc-950/70 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  )
}