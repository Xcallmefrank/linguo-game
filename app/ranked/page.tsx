"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { useLocale } from "@/components/locale-provider"
import { useToast } from "@/components/toast-provider"
import { COUNTRIES, getFlagFromCode } from "@/lib/countries"
import {
  getActiveRankedSeason,
  getRankedLeaderboard,
  getRankedSeasonHistory,
  RankedSeason,
} from "@/lib/ranked"
import { trackEvent } from "@/lib/analytics"
import { formatCooldown, getRankedCooldownMs } from "@/lib/ranked-cooldown"
import { isRankedNicknameAvailable } from "@/lib/ranked-submit"

type RankedEntry = {
  id: string
  nickname: string
  country_code: string
  score: number
  total_questions: number
  total_time_ms: number
  accuracy_percent: number
}

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

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export default function RankedPage() {
  const router = useRouter()
  const { t, locale } = useLocale()
  const { showToast } = useToast()

  const [nickname, setNickname] = useState("")
  const [countryCode, setCountryCode] = useState("IT")
  const [season, setSeason] = useState<RankedSeason | null>(null)
  const [history, setHistory] = useState<RankedSeason[]>([])
  const [leaderboard, setLeaderboard] = useState<RankedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [tick, setTick] = useState(0)
  const [cooldownMs, setCooldownMs] = useState(0)

  useEffect(() => {
    const savedNickname = localStorage.getItem("linguo_ranked_nickname")
    const savedCountry = localStorage.getItem("linguo_ranked_country")

    if (savedNickname) setNickname(savedNickname)
    if (savedCountry) setCountryCode(savedCountry)
  }, [])

  useEffect(() => {
    const loadRanked = async () => {
      try {
        setLoading(true)

        const [currentSeason, seasons] = await Promise.all([
          getActiveRankedSeason(),
          getRankedSeasonHistory(),
        ])

        const top = await getRankedLeaderboard(currentSeason.id)

        setSeason(currentSeason)
        setHistory(seasons)
        setLeaderboard(top.slice(0, 10) as RankedEntry[])
      } catch (error) {
        console.error(error)
        showToast(
          locale === "en"
            ? "I couldn't load ranked mode."
            : "Non sono riuscito a caricare la ranked.",
          "error"
        )
      } finally {
        setLoading(false)
      }
    }

    loadRanked()
  }, [locale, showToast])

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1)
      setCooldownMs(getRankedCooldownMs())
    }, 1000)

    setCooldownMs(getRankedCooldownMs())

    return () => clearInterval(interval)
  }, [])

  const countdown = useMemo(() => {
    if (!season) return "--"
    return formatRemaining(season.ends_at, locale)
  }, [season, locale, tick])

  const sortedCountries = useMemo(() => {
    const priority =
      locale === "it"
        ? ["IT", "GB", "US", "CA", "FR", "DE", "ES", "JP"]
        : ["US", "GB", "CA", "IT", "FR", "DE", "ES", "JP"]

    const priorityItems = COUNTRIES.filter((c) => priority.includes(c.code))
      .sort((a, b) => priority.indexOf(a.code) - priority.indexOf(b.code))

    const rest = COUNTRIES.filter((c) => !priority.includes(c.code)).sort((a, b) =>
      a.label.localeCompare(b.label)
    )

    return [...priorityItems, ...rest]
  }, [locale])

  const handleStartRanked = async () => {
    const cleanNickname = nickname.trim()

    if (cleanNickname.length < 2 || !season || cooldownMs > 0) return

    try {
      setStarting(true)

      const nicknameCheck = await isRankedNicknameAvailable(
        season.id,
        cleanNickname
      )

      if (!nicknameCheck.available) {
        showToast(
          locale === "en"
            ? "This nickname is already used in the current season."
            : "Questo nickname è già usato nella season attuale.",
          "error"
        )
        return
      }

      localStorage.setItem("linguo_ranked_nickname", cleanNickname)
      localStorage.setItem("linguo_ranked_country", countryCode)

      trackEvent("game_start", {
        mode: "ranked",
        locale,
        season: season.season_key,
      })

      router.push("/ranked/play")
    } catch (error) {
      console.error(error)
      showToast(
        locale === "en"
          ? "I couldn't validate your ranked nickname."
          : "Non sono riuscito a verificare il nickname ranked.",
        "error"
      )
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 py-8">
          <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            <p className="text-zinc-300">{t("common.loading")}</p>
          </Card>
        </div>
      </main>
    )
  }

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
              onClick={() => router.push("/")}
              className="text-sm text-zinc-400 transition-colors duration-200 hover:text-white"
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
                  {t("ranked.heading")}
                </h1>
                <p className="text-sm leading-6 text-zinc-400">
                  {t("ranked.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-left">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {t("ranked.currentSeason")}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {season?.display_name ?? "--"}
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

              {cooldownMs > 0 ? (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-left">
                  <p className="text-xs uppercase tracking-[0.18em] text-amber-300">
                    {t("ranked.cooldownActive")}
                  </p>
                  <p className="mt-2 text-sm text-zinc-200">
                    {t("ranked.cooldownText")}{" "}
                    <span className="font-semibold text-amber-300">
                      {formatCooldown(cooldownMs, locale)}
                    </span>
                  </p>
                </div>
              ) : null}

              <div className="space-y-3">
                <label className="block text-sm text-zinc-300">
                  {t("ranked.nickname")}
                </label>

                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={14}
                  className="w-full rounded-2xl border-zinc-700 bg-zinc-950/80 px-5 py-4 text-center text-base text-white shadow-inner placeholder:text-zinc-500"
                />

                <label className="block pt-1 text-sm text-zinc-300">
                  {t("ranked.country")}
                </label>

                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-4 text-base text-white outline-none"
                >
                  {sortedCountries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.label}
                    </option>
                  ))}
                </select>

                <Button
                  onClick={handleStartRanked}
                  disabled={nickname.trim().length < 2 || starting || !season || cooldownMs > 0}
                  className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400 disabled:bg-zinc-800 disabled:text-zinc-500"
                >
                  {starting
                    ? locale === "en"
                      ? "Checking..."
                      : "Controllo..."
                    : t("ranked.play")}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="rounded-[30px] border border-white/10 bg-black/40 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                  {t("ranked.top10")}
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
                      key={entry.id}
                      className="grid grid-cols-[40px_1fr_auto_auto] items-center gap-3 rounded-2xl bg-zinc-950/70 px-3 py-3"
                    >
                      <p className="text-sm text-zinc-500">#{index + 1}</p>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">
                          {getFlagFromCode(entry.country_code)} {entry.nickname}
                        </p>
                      </div>

                      <p className="text-sm text-green-400">
                        {entry.score}/{entry.total_questions}
                      </p>

                      <p className="text-sm text-zinc-400">
                        {formatTime(entry.total_time_ms)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="rounded-[30px] border border-white/10 bg-black/40 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                  Season history
                </p>
              </div>

              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-zinc-950/70 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">
                          {item.display_name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(item.starts_at).toLocaleDateString()} -{" "}
                          {new Date(item.ends_at).toLocaleDateString()}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.is_active
                          ? "bg-green-500/15 text-green-400"
                          : "bg-zinc-800 text-zinc-400"
                          }`}
                      >
                        {item.is_active ? "Active" : "Archived"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}