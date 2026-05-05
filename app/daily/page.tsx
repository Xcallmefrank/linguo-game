"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "motion/react"

import { Button } from "@/components/button"
import { Card } from "@/components/card"
import { DailyTimeline } from "@/components/daily-timeline"
import { useAuth } from "@/components/auth-provider"
import { useLocale } from "@/components/locale-provider"
import { useToast } from "@/components/toast-provider"

import { signInWithGoogle } from "@/lib/auth"
import { getMyProfile } from "@/lib/profile"
import { getDailyGame, getLocalDateKey } from "@/lib/daily"
import {
  calculateDailyStreak,
  getMyDailyAttempt,
  getMyRecentDailyAttempts,
  type DailyAttempt,
} from "@/lib/daily-sessions"

type GateState =
  | "checking-auth"
  | "signing-in"
  | "checking-profile"
  | "loading-daily"
  | "ready"
  | "error"

export default function DailyPage() {
  return (
    <Suspense fallback={<DailyHubFallback />}>
      <DailyHubContent />
    </Suspense>
  )
}

function DailyHubFallback() {
  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            Daily Word
          </p>

          <h1 className="mt-4 text-2xl font-semibold text-white">
            Preparo la mappa...
          </h1>

          <p className="mt-3 text-sm text-zinc-400">Caricamento...</p>
        </Card>
      </div>
    </main>
  )
}

function DailyHubContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { user, loading: authLoading } = useAuth()
  const { locale } = useLocale()
  const { showToast } = useToast()

  const requestedDay = searchParams.get("day")
  const invitedBy = searchParams.get("from")

  const todayKey = getLocalDateKey()
  const daily = useMemo(
    () => getDailyGame(locale, requestedDay ?? undefined),
    [locale, requestedDay]
  )

  const [gateState, setGateState] = useState<GateState>("checking-auth")
  const [profileNickname, setProfileNickname] = useState("")
  const [attempt, setAttempt] = useState<DailyAttempt | null>(null)
  const [recentAttempts, setRecentAttempts] = useState<DailyAttempt[]>([])
  const [countdown, setCountdown] = useState("")

  const isToday = daily.key === todayKey
  const hasCompletedDaily = Boolean(attempt)

  useEffect(() => {
    let cancelled = false

    const loadDaily = async () => {
      try {
        if (authLoading) {
          setGateState("checking-auth")
          return
        }

        if (!user) {
          setGateState("signing-in")

          const currentDailyPath = `${window.location.pathname}${window.location.search}`

          window.localStorage.setItem("linguo_after_login", currentDailyPath)
          window.localStorage.setItem("linguo_after_profile", currentDailyPath)

          await signInWithGoogle()
          return
        }

        setGateState("checking-profile")

        const profile = await getMyProfile(user.id)

        if (cancelled) return

        if (!profile) {
          const currentDailyPath = `${window.location.pathname}${window.location.search}`

          window.localStorage.setItem("linguo_after_profile", currentDailyPath)
          router.replace("/complete-profile")
          return
        }

        setProfileNickname(profile.nickname)
        setGateState("loading-daily")

        const [todayAttempt, attempts] = await Promise.all([
          getMyDailyAttempt(user.id, daily.key),
          getMyRecentDailyAttempts(user.id),
        ])

        if (cancelled) return

        setAttempt(todayAttempt)
        setRecentAttempts(attempts)
        setGateState("ready")
      } catch (error) {
        console.error("Errore caricamento daily hub:", error)

        if (!cancelled) {
          setGateState("error")
        }
      }
    }

    void loadDaily()

    return () => {
      cancelled = true
    }
  }, [authLoading, user, router, daily.key])

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const nextMidnight = new Date(now)

      nextMidnight.setHours(24, 0, 0, 0)

      const diff = Math.max(0, nextMidnight.getTime() - now.getTime())
      const hours = Math.floor(diff / 1000 / 60 / 60)
      const minutes = Math.floor((diff / 1000 / 60) % 60)
      const seconds = Math.floor((diff / 1000) % 60)

      setCountdown(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0"
        )}:${String(seconds).padStart(2, "0")}`
      )
    }

    updateCountdown()

    const interval = window.setInterval(updateCountdown, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  const streak = calculateDailyStreak(
    attempt ? mergeAttempt(recentAttempts, attempt) : recentAttempts,
    todayKey
  )

  const playHref = invitedBy
    ? `/daily/play?day=${daily.key}&from=${encodeURIComponent(invitedBy)}`
    : `/daily/play?day=${daily.key}`

  const handlePlay = () => {
    if (hasCompletedDaily) return
    router.push(playHref)
  }

  const handleShareDaily = async () => {
    if (!attempt) return

    const origin = window.location.origin
    const from = encodeURIComponent(profileNickname || "Linguo")
    const shareUrl = `${origin}/daily?day=${daily.key}&from=${from}`

    const shareText =
      locale === "en"
        ? `${profileNickname || "Someone"} scored ${attempt.score}/${attempt.total_questions} on Linguo Daily Word. Can you solve it?`
        : `${profileNickname || "Qualcuno"} ha fatto ${attempt.score}/${attempt.total_questions} nella Daily Word di Linguo. Riesci a risolverla?`

    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)

      showToast(
        locale === "en" ? "Challenge link copied." : "Link sfida copiato.",
        "success"
      )
    } catch (error) {
      console.error("Errore copia daily:", error)
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Linguo Daily Word",
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        console.error("Condivisione daily annullata:", error)
      }
    }
  }

  if (authLoading || gateState !== "ready") {
    return (
      <main className="min-h-screen px-5 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              Daily Word
            </p>

            <h1 className="mt-4 text-2xl font-semibold text-white">
              {locale === "en"
                ? "Preparing your path..."
                : "Preparo il percorso..."}
            </h1>

            <p className="mt-3 text-sm text-zinc-400">
              {gateState === "signing-in"
                ? locale === "en"
                  ? "Taking you to Google sign-in..."
                  : "Ti porto al login Google..."
                : gateState === "checking-profile"
                  ? locale === "en"
                    ? "Checking your profile..."
                    : "Controllo il profilo..."
                  : gateState === "error"
                    ? locale === "en"
                      ? "Something went wrong."
                      : "Qualcosa è andato storto."
                    : locale === "en"
                      ? "Loading..."
                      : "Caricamento..."}
            </p>

            {gateState === "error" ? (
              <Button
                onClick={() => router.push("/")}
                className="mt-6 h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400"
              >
                {locale === "en" ? "Back home" : "Torna alla home"}
              </Button>
            ) : null}
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="h-10 rounded-full border border-zinc-800 bg-black/30 px-4 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
          >
            ← {locale === "en" ? "Back home" : "Torna alla home"}
          </button>

          <div className="rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-green-300">
            Daily
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="relative overflow-hidden rounded-[36px] border border-white/10 bg-black/40 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,197,94,0.14),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(250,204,21,0.09),transparent_30%)]" />

            <div className="relative space-y-7">
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                  {daily.key}
                </p>

                <div className="mt-4 text-6xl">{daily.word.emoji}</div>

                <h1 className="mt-4 text-3xl font-semibold text-white">
                  Daily Word
                </h1>

                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {invitedBy
                    ? locale === "en"
                      ? `${invitedBy} challenged you. One hidden word, one chance.`
                      : `${invitedBy} ti ha sfidato. Una parola nascosta, una possibilità.`
                    : locale === "en"
                      ? "Follow the path. Keep your streak alive."
                      : "Segui il percorso. Tieni viva la tua serie."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-green-300">
                    {locale === "en" ? "Streak" : "Serie"}
                  </p>

                  <p className="mt-2 text-3xl font-semibold text-white">
                    {streak}
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    {locale === "en" ? "days" : "giorni"}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {locale === "en" ? "Today" : "Oggi"}
                  </p>

                  <p
                    className={`mt-2 text-lg font-semibold ${
                      hasCompletedDaily ? "text-green-400" : "text-amber-300"
                    }`}
                  >
                    {hasCompletedDaily
                      ? locale === "en"
                        ? "Completed"
                        : "Completata"
                      : locale === "en"
                        ? "Available"
                        : "Disponibile"}
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    {hasCompletedDaily
                      ? `${attempt?.score}/${attempt?.total_questions}`
                      : locale === "en"
                        ? "ready now"
                        : "pronta ora"}
                  </p>
                </div>
              </div>

              <DailyTimeline
                attempts={attempt ? mergeAttempt(recentAttempts, attempt) : recentAttempts}
                centerKey={daily.key}
                todayKey={todayKey}
                locale={locale}
              />

              <div className="rounded-[30px] border border-white/10 bg-zinc-950/70 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  {locale === "en" ? "Current stop" : "Tappa attuale"}
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {hasCompletedDaily
                    ? `${daily.word.lemmaIt} / ${daily.word.lemmaEn}`
                    : locale === "en"
                      ? "Mystery word"
                      : "Parola misteriosa"}
                </h2>

                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {hasCompletedDaily
                    ? daily.curiosity[locale]
                    : locale === "en"
                      ? "Solve today’s question to reveal the word and keep the streak alive."
                      : "Risolvi la domanda di oggi per rivelare la parola e continuare la serie."}
                </p>
              </div>

              {!hasCompletedDaily ? (
                <Button
                  onClick={handlePlay}
                  className="h-13 w-full rounded-2xl bg-green-500 py-4 text-base font-semibold text-black transition-all duration-200 hover:scale-[1.01] hover:bg-green-400"
                >
                  {locale === "en" ? "Play today’s Daily" : "Gioca la Daily di oggi"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-5 text-center">
                    <p className="text-xs uppercase tracking-[0.18em] text-green-300">
                      {locale === "en" ? "Next daily in" : "Prossima daily tra"}
                    </p>

                    <p className="mt-2 font-mono text-3xl font-semibold text-white">
                      {isToday ? countdown : "--:--:--"}
                    </p>
                  </div>

                  <Button
                    onClick={handleShareDaily}
                    className="h-12 w-full rounded-2xl border border-green-500/30 bg-green-500/10 text-base font-medium text-green-300 transition-all duration-200 hover:bg-green-500/15"
                  >
                    {locale === "en" ? "Challenge a friend" : "Sfida un amico"}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}

function mergeAttempt(attempts: DailyAttempt[], attempt: DailyAttempt) {
  const map = new Map<string, DailyAttempt>()

  for (const item of attempts) {
    map.set(item.daily_key, item)
  }

  map.set(attempt.daily_key, attempt)

  return Array.from(map.values()).sort((a, b) =>
    b.daily_key.localeCompare(a.daily_key)
  )
}