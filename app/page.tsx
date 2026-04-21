"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import Image from "next/image"
import { Card } from "@/components/card"
import { Input } from "@/components/input"
import { Button } from "@/components/button"
import { AdSenseBanner } from "@/components/adsense-banner"
import { useLocale } from "@/components/locale-provider"
import { GameMode } from "@/lib/game-mode"

export default function HomePage() {
  const [nickname, setNickname] = useState("")
  const [selectedMode, setSelectedMode] = useState<GameMode>("normal")
  const router = useRouter()
  const { t } = useLocale()

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
  }, [])

  const handleStart = () => {
    const cleanName = nickname.trim()
    if (cleanName.length < 2) return

    localStorage.setItem("linguo_nickname", cleanName)
    localStorage.setItem("linguo_mode", selectedMode)
    localStorage.removeItem("linguo_last_challenge_code")
    router.push("/play")
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
                          onClick={() => setSelectedMode(mode)}
                          className={`rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                            active
                              ? "border-green-500 bg-green-500/15 shadow-[0_0_0_1px_rgba(34,197,94,0.25)]"
                              : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-600 hover:bg-zinc-900"
                          }`}
                        >
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
                        </button>
                      )
                    })}
                  </div>
                </div>

                <Button
                  className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:scale-[1.01] hover:bg-green-400 disabled:bg-zinc-800 disabled:text-zinc-500"
                  disabled={nickname.trim().length < 2}
                  onClick={handleStart}
                >
                  {t("home.start")}
                </Button>
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
    </main>
  )
}