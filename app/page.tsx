"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import Image from "next/image"
import { Card } from "@/components/card"
import { Input } from "@/components/input"
import { Button } from "@/components/button"
import { AdSenseBanner } from "@/components/adsense-banner"
import { useLocale } from "@/components/locale-provider"
import { GameMode } from "@/lib/game-mode"
import { trackEvent } from "@/lib/analytics"

export default function HomePage() {
  const [nickname, setNickname] = useState("")
  const [selectedMode, setSelectedMode] = useState<GameMode>("normal")
  const [showRankedSheet, setShowRankedSheet] = useState(false)
  const [rankedResponsibilityAccepted, setRankedResponsibilityAccepted] =
    useState(false)

  const router = useRouter()
  const { t, locale } = useLocale()

  useEffect(() => {
    const savedName = localStorage.getItem("linguo_nickname")
    const savedMode = localStorage.getItem("linguo_mode") as GameMode | null

    if (savedName) {
      setNickname(savedName)
    }

    if (
      savedMode === "normal" ||
      savedMode === "hard" ||
      savedMode === "similar"
    ) {
      setSelectedMode(savedMode)
    }

    trackEvent("home_view", { locale })
  }, [locale])

  const handleStart = () => {
    const cleanName = nickname.trim()
    if (cleanName.length < 2) return

    trackEvent("game_start", {
      mode: selectedMode,
      locale,
    })

    localStorage.setItem("linguo_nickname", cleanName)
    localStorage.setItem("linguo_mode", selectedMode)
    localStorage.removeItem("linguo_last_challenge_code")
    router.push("/play")
  }

  const handleOpenRanked = () => {
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
                <div className="space-y-2 text-center">
                  <label className="block text-sm text-zinc-300">
                    {t("home.name")}
                  </label>
                </div>

                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t("home.namePlaceholder")}
                  maxLength={12}
                  className="w-full rounded-2xl border-zinc-700 bg-zinc-950/80 px-5 py-4 text-center text-base text-white shadow-inner placeholder:text-zinc-500"
                />

                <div className="space-y-3 pt-1">
                  <p className="text-center text-sm text-zinc-300">
                    {t("home.mode")}
                  </p>

                  <div className="grid gap-3">
                    {(["normal", "hard", "similar"] as GameMode[]).map((mode) => {
                      const active = selectedMode === mode

                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setSelectedMode(mode)
                            trackEvent("mode_selected", {
                              mode,
                              locale,
                            })
                          }}
                          className={`rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${active
                              ? "border-green-500 bg-green-500/15 shadow-[0_0_0_1px_rgba(34,197,94,0.25)]"
                              : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-600 hover:bg-zinc-900"
                            }`}
                        >
                          <div className="space-y-1">
                            <p
                              className={`font-medium ${active ? "text-green-400" : "text-white"
                                }`}
                            >
                              {t(`mode.${mode}`)}
                            </p>
                            <p className="text-sm text-zinc-400">
                              {t(`mode.${mode}.desc`)}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:scale-[1.01] hover:bg-green-400 disabled:bg-zinc-800 disabled:text-zinc-500"
                    disabled={nickname.trim().length < 2}
                    onClick={handleStart}
                  >
                    {t("home.start")}
                  </Button>
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

                  <button
                    type="button"
                    onClick={handleOpenRanked}
                    className="group relative h-16 w-full overflow-hidden rounded-[22px] border border-white/10 bg-zinc-950/80 px-5 shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-green-500/30"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-green-500/25 via-green-400/15 to-transparent transition-opacity duration-300 group-hover:opacity-0" />

                    <span
                      className="absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100"
                      style={{
                        backgroundImage:
                          "linear-gradient(45deg, rgba(255,255,255,0.92) 25%, rgba(10,10,10,0.96) 25%, rgba(10,10,10,0.96) 50%, rgba(255,255,255,0.92) 50%, rgba(255,255,255,0.92) 75%, rgba(10,10,10,0.96) 75%, rgba(10,10,10,0.96) 100%)",
                        backgroundSize: "26px 26px",
                        transform: "skewX(-12deg) scale(1.08)",
                      }}
                    />

                    <span className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/15" />

                    <span className="relative z-10 flex h-full items-center justify-between">
                      <span className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-lg shadow-inner backdrop-blur-md transition-transform duration-300 group-hover:rotate-[-12deg] group-hover:scale-105">
                          🏁
                        </span>

                        <span className="text-left">
                          <span className="inline-block rounded-full border border-white/10 bg-black/45 px-3 py-1 text-base font-semibold text-white backdrop-blur-md">
                            {t("home.ranked")}
                          </span>

                          <span className="mt-1 block">
                            <span className="inline-block rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-zinc-200 backdrop-blur-md">
                              Global challenge
                            </span>
                          </span>
                        </span>
                      </span>

                      <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs font-medium text-green-300 backdrop-blur-md transition-all duration-300 group-hover:border-black/20 group-hover:bg-white/75 group-hover:text-black">
                        Top 50
                      </span>
                    </span>
                  </button>
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
                      onChange={(e) =>
                        setRankedResponsibilityAccepted(e.target.checked)
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