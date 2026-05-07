"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import Image from "next/image"

import { Card } from "@/components/card"
import { Input } from "@/components/input"
import { Button } from "@/components/button"
import { AdSenseBanner } from "@/components/adsense-banner"
import { useLocale } from "@/components/locale-provider"
import { useAuth } from "@/components/auth-provider"
import { signInWithGoogle, signOut } from "@/lib/auth"
import { getMyProfile } from "@/lib/profile"
import { GameMode } from "@/lib/game-mode"
import { trackEvent } from "@/lib/analytics"
import {
  BADGE_DEFINITIONS,
  getLevelSnapshot,
  getMyJourney,
  type JourneyProgress,
  type UserBadge,
} from "@/lib/journey"

export default function HomePage() {
  const [nickname, setNickname] = useState("")
  const [selectedMode, setSelectedMode] = useState<GameMode>("normal")
  const [showRankedSheet, setShowRankedSheet] = useState(false)
  const [rankedResponsibilityAccepted, setRankedResponsibilityAccepted] =
    useState(false)
  const [profileNickname, setProfileNickname] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [journeyProgress, setJourneyProgress] =
    useState<JourneyProgress | null>(null)
  const [journeyBadges, setJourneyBadges] = useState<UserBadge[]>([])

  const router = useRouter()
  const { t, locale } = useLocale()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    const savedName = localStorage.getItem("linguo_nickname")
    const savedMode = localStorage.getItem("linguo_mode") as GameMode | null

    if (savedName) setNickname(savedName)

    if (
      savedMode === "normal" ||
      savedMode === "hard" ||
      savedMode === "similar"
    ) {
      setSelectedMode(savedMode)
    }

    trackEvent("home_view", { locale })
  }, [locale])

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      if (authLoading) return

      if (!user) {
        setProfileNickname(null)
        setJourneyProgress(null)
        setJourneyBadges([])
        return
      }

      try {
        setProfileLoading(true)

        const [profile, journey] = await Promise.all([
          getMyProfile(user.id),
          getMyJourney(user.id),
        ])

        if (cancelled) return

        setProfileNickname(profile?.nickname ?? null)
        setJourneyProgress(journey.progress)
        setJourneyBadges(journey.badges)
      } catch (error) {
        console.error("Errore caricamento profilo home:", error)

        if (!cancelled) {
          setProfileNickname(null)
          setJourneyProgress(null)
          setJourneyBadges([])
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  const isRegisteredUser = Boolean(user && profileNickname)
  const identityLabel = profileNickname ?? user?.email ?? "Utente connesso"

  const journeySnapshot = useMemo(() => {
    return getLevelSnapshot(journeyProgress?.xp ?? 0, locale)
  }, [journeyProgress?.xp, locale])

  const latestBadge = useMemo(() => {
    const badgeId = journeyBadges[0]?.badge_id

    if (!badgeId) return null

    return BADGE_DEFINITIONS.find((badge) => badge.id === badgeId) ?? null
  }, [journeyBadges])

  const handleStart = () => {
    const fallbackName = nickname.trim()
    const effectiveName = profileNickname?.trim() || fallbackName

    if (effectiveName.length < 2) return

    trackEvent("cta_click", {
      source: "home",
      label: "quick_play_start",
      target: "/play",
      mode: selectedMode,
      authenticated: Boolean(user),
    })

    trackEvent("game_start", {
      mode: selectedMode,
      locale,
    })

    localStorage.setItem("linguo_nickname", effectiveName)
    localStorage.setItem("linguo_mode", selectedMode)
    localStorage.removeItem("linguo_last_challenge_code")
    router.push("/play")
  }

  const handleOpenDaily = () => {
    trackEvent("cta_click", {
      source: "home",
      label: "daily_word",
      target: "/daily",
      authenticated: Boolean(user),
    })

    trackEvent("daily_opened", {
      locale,
      authenticated: Boolean(user),
    })

    localStorage.setItem("linguo_after_login", "/daily")
    localStorage.setItem("linguo_after_profile", "/daily")

    router.push("/daily")
  }

  const handleOpenRanked = () => {
    trackEvent("cta_click", {
      source: "home",
      label: "ranked",
      target: "/ranked",
      authenticated: Boolean(user),
    })

    trackEvent("ranked_opened", {
      source: "home",
      locale,
      authenticated: Boolean(user),
    })

    setRankedResponsibilityAccepted(false)
    setShowRankedSheet(true)
  }

  const handleCloseRanked = () => {
    setShowRankedSheet(false)
    setRankedResponsibilityAccepted(false)
  }

  const handleProceedRanked = () => {
    if (!rankedResponsibilityAccepted) return

    setShowRankedSheet(false)
    router.push("/ranked")
  }

  const handleGoogleLogin = async () => {
    try {
      trackEvent("auth_click", {
        source: "home",
        action: "google_login",
      })

      await signInWithGoogle()
    } catch (error) {
      console.error("Errore login Google:", error)
    }
  }

  const handleLogout = async () => {
    try {
      trackEvent("auth_click", {
        source: "home",
        action: "logout",
      })

      await signOut()
      setProfileNickname(null)
      setJourneyProgress(null)
      setJourneyBadges([])
      router.push("/")
    } catch (error) {
      console.error("Errore logout:", error)
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full"
        >
          <Card className="rounded-[36px] border border-white/10 bg-black/40 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <div className="space-y-8">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-zinc-400/30 bg-gradient-to-br from-green-500/20 to-black p-2 shadow-[0_12px_35px_rgba(34,197,94,0.16)] backdrop-blur-xl">
                  <div className="relative h-16 w-16">
                    <Image
                      src="/linguo-icon.png"
                      alt="Linguo logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-4xl font-semibold tracking-tight text-white">
                    Linguo
                  </h1>
                  <p className="text-sm leading-6 text-zinc-300">
                    {t("home.tagline")}
                  </p>
                </div>
              </div>

              <div className="mx-auto w-full max-w-md space-y-4">
                <div className="space-y-3">
                  {authLoading || profileLoading ? null : user ? (
                    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 text-left">
                          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                            profilo
                          </p>
                          <p className="truncate text-base font-semibold text-white">
                            {identityLabel}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => router.push("/profile")}
                            className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-900"
                          >
                            Profilo
                          </button>

                          <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-900"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="group relative h-[62px] w-full overflow-hidden rounded-[22px] border border-white/10 bg-zinc-950/80 px-4 text-left shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-green-500/30"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-green-400/10 to-transparent transition-opacity duration-300 group-hover:opacity-0" />

                      <span
                        className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                        style={{
                          background:
                            "radial-gradient(circle at 78% 50%, rgba(34,197,94,0.35) 0%, rgba(34,197,94,0.18) 14%, transparent 32%), linear-gradient(90deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.08) 35%, transparent 70%)",
                        }}
                      />

                      <span className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/15" />

                      <span className="relative z-10 flex h-full items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/50 shadow-inner backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 48 48"
                              className="h-5 w-5"
                              aria-hidden="true"
                            >
                              <path
                                fill="#FFC107"
                                d="M43.611 20.083H42V20H24v8h11.303C33.659 32.657 29.221 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.277 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                              />
                              <path
                                fill="#FF3D00"
                                d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.277 4 24 4c-7.682 0-14.344 4.337-17.694 10.691z"
                              />
                              <path
                                fill="#4CAF50"
                                d="M24 44c5.176 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.137 35.091 26.715 36 24 36c-5.2 0-9.625-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                              />
                              <path
                                fill="#1976D2"
                                d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.084 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                              />
                            </svg>
                          </span>

                          <span className="min-w-0 text-left">
                            <span className="block truncate text-[15px] font-semibold text-white sm:text-base">
                              Accedi con Google
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-zinc-200 sm:text-sm">
                              Accedi e salva i tuoi progressi
                            </span>
                          </span>
                        </span>

                        <span className="relative flex shrink-0 items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_14px_rgba(74,222,128,0.7)] transition-transform duration-300 group-hover:scale-110" />
                          <span className="text-green-300 transition-transform duration-300 group-hover:translate-x-0.5">
                            →
                          </span>
                        </span>
                      </span>
                    </button>
                  )}
                </div>

                {!isRegisteredUser ? (
                  <>
                    <div className="space-y-2 text-center">
                      <label className="block text-sm text-zinc-300">
                        {t("home.name")}
                      </label>
                    </div>

                    <Input
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      placeholder={t("home.namePlaceholder")}
                      maxLength={12}
                      className="w-full rounded-2xl border-zinc-700 bg-zinc-950/80 px-5 py-4 text-center text-base text-white shadow-inner placeholder:text-zinc-500"
                    />
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-green-500/15 bg-green-500/[0.08] px-4 py-4 text-center">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        giocatore attivo
                      </p>
                      <p className="mt-1 text-lg font-semibold text-green-400">
                        {profileNickname}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push("/journey")}
                      className="group w-full rounded-[26px] border border-green-500/20 bg-zinc-950/70 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-green-500/35 hover:bg-zinc-950"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-2xl transition-transform duration-300 group-hover:scale-105">
                          {latestBadge?.icon ?? "🗺️"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-green-300">
                                Journey
                              </p>

                              <p className="mt-1 text-base font-semibold text-white">
                                Lv. {journeySnapshot.level} ·{" "}
                                {journeySnapshot.title}
                              </p>
                            </div>

                            <p className="text-xs font-semibold text-green-300">
                              {journeySnapshot.xp} XP
                            </p>
                          </div>

                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
                              <span>
                                {journeySnapshot.xpIntoLevel}/
                                {journeySnapshot.nextLevelXp} XP
                              </span>

                              <span>-{journeySnapshot.xpToNextLevel} XP</span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-300 transition-all duration-500"
                                style={{
                                  width: `${journeySnapshot.progressPercent}%`,
                                }}
                              />
                            </div>
                          </div>

                          <p className="mt-3 truncate text-xs text-zinc-500">
                            {latestBadge
                              ? `Badge: ${latestBadge.title[locale]}`
                              : locale === "en"
                                ? "Complete activities to unlock badges."
                                : "Completa attività per sbloccare badge."}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                <div className="space-y-3 pt-1">
                  <p className="text-center text-sm text-zinc-300">
                    {t("home.mode")}
                  </p>

                  <div className="grid gap-3">
                    {(["normal", "hard", "similar"] as GameMode[]).map(
                      (mode) => {
                        const active = selectedMode === mode

                        return (
                          <motion.button
                            key={mode}
                            type="button"
                            onClick={() => {
                              setSelectedMode(mode)
                              trackEvent("mode_selected", {
                                mode,
                                locale,
                              })
                            }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.995 }}
                            className={`relative overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                              active
                                ? "border-green-500 bg-green-500/15 shadow-[0_0_0_1px_rgba(34,197,94,0.25)]"
                                : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-600 hover:bg-zinc-900"
                            }`}
                          >
                            <div className="relative z-10">
                              <div className="space-y-1">
                                <p
                                  className={`font-medium ${
                                    active ? "text-green-400" : "text-white"
                                  }`}
                                >
                                  {t(`mode.${mode}`)}
                                </p>
                                <p className="text-sm text-zinc-400">
                                  {t(`mode.${mode}.desc`)}
                                </p>
                              </div>

                              <div className="mt-3 h-7 overflow-hidden">
                                {mode === "normal" ? (
                                  <SeamlessSoftWave active={active} />
                                ) : null}
                                {mode === "hard" ? (
                                  <SeamlessSharpWave active={active} />
                                ) : null}
                                {mode === "similar" ? (
                                  <SeamlessDoubleWave active={active} />
                                ) : null}
                              </div>
                            </div>
                          </motion.button>
                        )
                      }
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:scale-[1.01] hover:bg-green-400 disabled:bg-zinc-800 disabled:text-zinc-500"
                    disabled={!isRegisteredUser && nickname.trim().length < 2}
                    onClick={handleStart}
                  >
                    {t("home.start")}
                  </Button>
                </div>

                <div className="pt-4">
                  <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" />

                  <div className="mb-3 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      Daily Word
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {locale === "en"
                        ? "One word, one question, one streak."
                        : "Una parola, una domanda, una serie."}
                    </p>
                  </div>

                  <motion.button
                    type="button"
                    onClick={handleOpenDaily}
                    whileHover={{ scale: 1.012 }}
                    whileTap={{ scale: 0.995 }}
                    className="group relative h-[64px] w-full overflow-hidden rounded-[22px] border border-green-500/20 bg-zinc-950/80 shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-green-400/40"
                  >
                    <motion.div
                      animate={{
                        opacity: [0.18, 0.32, 0.18],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_50%,rgba(34,197,94,0.38),transparent_55%)] blur-xl"
                    />

                    <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(34,197,94,0.18),rgba(250,204,21,0.08),transparent)]" />

                    <div className="relative z-10 flex h-full items-center justify-between gap-3 px-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-green-500/20 bg-black/35 text-xl shadow-inner backdrop-blur-md">
                          🌗
                        </div>

                        <div className="min-w-0 text-left">
                          <p className="truncate text-base font-semibold text-white">
                            Daily Word
                          </p>
                          <p className="mt-0.5 truncate text-sm text-white/75">
                            {locale === "en"
                              ? "Discover today’s word"
                              : "Scopri la parola di oggi"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-green-300 transition-transform duration-300 group-hover:translate-x-0.5">
                        →
                      </div>
                    </div>
                  </motion.button>
                </div>

                <div className="pt-4">
                  <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" />

                  <div className="mb-3 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {t("home.rankedBadge")}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {t("home.rankedHint")}
                    </p>
                  </div>

                  <motion.button
                    type="button"
                    onClick={handleOpenRanked}
                    whileHover={{ scale: 1.012 }}
                    whileTap={{ scale: 0.995 }}
                    className="group relative h-[68px] w-full overflow-hidden rounded-[22px] border border-white/10 shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-red-400/40"
                  >
                    <div className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(135deg,rgba(127,29,29,0.98),rgba(220,38,38,0.9))]" />

                    <motion.div
                      animate={{
                        opacity: [0.2, 0.38, 0.2],
                        scale: [1, 1.04, 1],
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="pointer-events-none absolute left-0 top-0 h-full w-[46%] bg-[radial-gradient(circle_at_30%_50%,rgba(255,120,120,0.35),transparent_60%)] blur-xl"
                    />

                    <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden bg-zinc-950">
                      <motion.div
                        animate={{ x: ["-8%", "8%", "-8%"] }}
                        transition={{
                          duration: 5.2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-[-10%]"
                        style={{
                          backgroundImage:
                            "linear-gradient(45deg, rgba(255,255,255,0.96) 25%, rgba(12,12,12,0.98) 25%, rgba(12,12,12,0.98) 50%, rgba(255,255,255,0.96) 50%, rgba(255,255,255,0.96) 75%, rgba(12,12,12,0.98) 75%, rgba(12,12,12,0.98) 100%)",
                          backgroundSize: "22px 22px",
                          transform: "skewX(-14deg) scale(1.08)",
                          opacity: 0.9,
                        }}
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_30%,transparent_70%,rgba(255,255,255,0.04))]" />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-r from-white/6 via-transparent to-white/6" />
                    <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/12" />

                    <div className="relative z-10 flex h-full items-center justify-between gap-3 px-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/35 shadow-inner backdrop-blur-md">
                          <motion.div
                            animate={{ rotate: [-4, 4, -4] }}
                            transition={{
                              duration: 2.3,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="text-white"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-[18px] w-[18px]"
                              fill="none"
                            >
                              <path
                                d="M5 3v18"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                              />
                              <path
                                d="M6.5 5.5h11v9h-11z"
                                fill="currentColor"
                                opacity="0.12"
                              />
                              <path
                                d="M6.5 5.5h2.75v2.25H6.5zm5.5 0h2.75v2.25H12zm-2.75 2.25H12V10H9.25zm5.5 2.25h2.75V12.5H14.75zM6.5 10h2.75v2.5H6.5zm5.5 2.5H14.75V15H12zm-2.75 0H12V15H9.25z"
                                fill="currentColor"
                              />
                            </svg>
                          </motion.div>
                        </div>

                        <div className="min-w-0 text-left">
                          <p className="truncate text-base font-semibold text-white">
                            {t("home.ranked")}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-white/85">
                            {t("home.globalChallenge")}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <motion.div
                          animate={{
                            boxShadow: [
                              "0 8px 20px rgba(0,0,0,0.18)",
                              "0 10px 24px rgba(220,38,38,0.18)",
                              "0 8px 20px rgba(0,0,0,0.18)",
                            ],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="rounded-full border border-black/20 bg-white px-3 py-1 text-xs font-extrabold tracking-[0.18em] text-black"
                        >
                          TOP 25
                        </motion.div>
                      </div>
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full"
        >
          <AdSenseBanner slot="5675946231" className="min-h-24" />
        </motion.div>
      </div>

      <AnimatePresence>
        {showRankedSheet ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
              onClick={handleCloseRanked}
            />

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.28 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md px-4 pb-4"
            >
              <div className="rounded-[30px] border border-white/10 bg-zinc-950/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/10" />

                <div className="space-y-4">
                  <div className="space-y-2 text-center">
                    <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                      {t("home.ranked")}
                    </p>

                    <h2 className="text-xl font-semibold tracking-tight text-white">
                      {t("ranked.disclaimerTitle")}
                    </h2>

                    <p className="text-sm leading-6 text-zinc-400">
                      {t("ranked.disclaimerText")}
                    </p>
                  </div>

                  <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <input
                      type="checkbox"
                      checked={rankedResponsibilityAccepted}
                      onChange={(event) =>
                        setRankedResponsibilityAccepted(event.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-green-500 focus:ring-green-500"
                    />

                    <span className="text-sm leading-6 text-zinc-200">
                      {t("ranked.disclaimerCheck")}
                    </span>
                  </label>

                  <div className="space-y-3">
                    <Button
                      onClick={handleProceedRanked}
                      disabled={!rankedResponsibilityAccepted}
                      className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400 disabled:bg-zinc-800 disabled:text-zinc-500"
                    >
                      {t("ranked.disclaimerContinue")}
                    </Button>

                    <Button
                      onClick={handleCloseRanked}
                      className="h-12 w-full rounded-2xl border border-zinc-800 bg-transparent text-base font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
                    >
                      {t("ranked.disclaimerCancel")}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </main>
  )
}

function SeamlessSoftWave({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 280 28"
      className="h-full w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <path
          id="soft-wave-segment"
          d="M0 14 C14 8 28 20 42 14 C56 8 70 20 84 14 C98 8 112 20 126 14 C140 8 154 20 168 14"
        />
      </defs>

      <motion.g
        animate={{ x: [0, -168] }}
        transition={{ duration: 5.4, repeat: Infinity, ease: "linear" }}
        style={{ opacity: active ? 0.95 : 0.45 }}
      >
        {[0, 168, 336].map((offset) => (
          <use
            key={offset}
            href="#soft-wave-segment"
            x={offset}
            y="0"
            fill="none"
            stroke={active ? "#22c55e" : "#71717a"}
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}
      </motion.g>
    </svg>
  )
}

function SeamlessSharpWave({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 280 32"
      className="h-full w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <path
          id="hard-wave-segment"
          d="M0 16 C14 1 28 31 42 16 C56 1 70 31 84 16 C98 1 112 31 126 16 C140 1 154 31 168 16"
        />
      </defs>

      <motion.g
        animate={{ x: [0, -168] }}
        transition={{ duration: 4.6, repeat: Infinity, ease: "linear" }}
      >
        {[0, 168, 336].map((offset) => (
          <g key={offset}>
            <use
              href="#hard-wave-segment"
              x={offset}
              y="0"
              fill="none"
              stroke="#dc2626"
              strokeWidth="7"
              strokeLinecap="round"
              style={{ opacity: active ? 0.16 : 0.06 }}
            />

            <use
              href="#hard-wave-segment"
              x={offset}
              y="0"
              fill="none"
              stroke="#ef4444"
              strokeWidth="4.5"
              strokeLinecap="round"
              style={{ opacity: active ? 0.26 : 0.1 }}
            />

            <use
              href="#hard-wave-segment"
              x={offset}
              y="0"
              fill="none"
              stroke={active ? "#f87171" : "#a1a1aa"}
              strokeWidth="2.4"
              strokeLinecap="round"
              style={{ opacity: active ? 1 : 0.5 }}
            />
          </g>
        ))}
      </motion.g>
    </svg>
  )
}

function SeamlessDoubleWave({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 280 28"
      className="h-full w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <path
          id="double-wave-top"
          d="M0 9 C14 4 28 14 42 9 C56 4 70 14 84 9 C98 4 112 14 126 9 C140 4 154 14 168 9"
        />
        <path
          id="double-wave-bottom"
          d="M0 19 C14 14 28 24 42 19 C56 14 70 24 84 19 C98 14 112 24 126 19 C140 14 154 24 168 19"
        />
      </defs>

      <motion.g
        animate={{ x: [0, -168] }}
        transition={{ duration: 4.4, repeat: Infinity, ease: "linear" }}
      >
        {[0, 168, 336].map((offset) => (
          <g key={offset}>
            <use
              href="#double-wave-top"
              x={offset}
              y="0"
              fill="none"
              stroke={active ? "#2563eb" : "#71717a"}
              strokeWidth="2"
              strokeLinecap="round"
              style={{ opacity: active ? 0.95 : 0.42 }}
            />

            <use
              href="#double-wave-top"
              x={offset}
              y="0"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="4.2"
              strokeLinecap="round"
              style={{ opacity: active ? 0.1 : 0.03 }}
            />

            <use
              href="#double-wave-bottom"
              x={offset}
              y="0"
              fill="none"
              stroke={active ? "#67e8f9" : "#71717a"}
              strokeWidth="2"
              strokeLinecap="round"
              style={{ opacity: active ? 0.9 : 0.3 }}
            />

            <use
              href="#double-wave-bottom"
              x={offset}
              y="0"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ opacity: active ? 0.12 : 0.04 }}
            />
          </g>
        ))}
      </motion.g>
    </svg>
  )
}