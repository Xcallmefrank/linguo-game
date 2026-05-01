"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/toast-provider"

import { COUNTRIES } from "@/lib/countries"
import {
  createMyProfile,
  getMyProfile,
  isNicknameAvailable,
} from "@/lib/profile"
import { validateNickname } from "@/lib/nickname-filter"

function getAfterProfileTarget(fallback: string) {
  if (typeof window === "undefined") return fallback

  const saved = window.localStorage.getItem("linguo_after_profile")

  window.localStorage.removeItem("linguo_after_profile")

  if (saved && saved.startsWith("/")) {
    return saved
  }

  return fallback
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { showToast } = useToast()

  const [nickname, setNickname] = useState("")
  const [countryCode, setCountryCode] = useState("IT")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (loading) return

      if (!user) {
        router.replace("/")
        return
      }

      try {
        const existing = await getMyProfile(user.id)

        if (!cancelled && existing) {
          router.replace(getAfterProfileTarget("/"))
        }
      } catch (error) {
        console.error("Errore controllo profilo:", error)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [user, loading, router])

  const sortedCountries = useMemo(() => {
    return [...COUNTRIES].sort((a, b) => a.label.localeCompare(b.label))
  }, [])

  const handleSaveProfile = async () => {
    if (!user) return

    const validation = validateNickname(nickname)

    if (!validation.valid) {
      showToast(validation.message, "error")
      return
    }

    try {
      setSaving(true)

      const available = await isNicknameAvailable(nickname, user.id)

      if (!available) {
        showToast("Questo nickname è già usato.", "error")
        return
      }

      await createMyProfile({
        userId: user.id,
        nickname: nickname.trim(),
        countryCode,
      })

      showToast("Profilo creato.", "success")

      router.replace(getAfterProfileTarget("/ranked"))
    } catch (error) {
      console.error(error)
      showToast("Non sono riuscito a creare il profilo.", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            profilo
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            Completa il tuo profilo
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Scegli un nickname unico e il tuo paese.
          </p>

          <div className="mt-7 space-y-4">
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-zinc-300">
                Nickname
              </label>

              <Input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                maxLength={14}
                className="w-full rounded-2xl border-zinc-700 bg-zinc-950/80 px-5 py-4 text-center text-base text-white shadow-inner placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-zinc-300">
                Paese
              </label>

              <select
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
                className="h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-950/80 px-4 text-base text-white outline-none"
              >
                {sortedCountries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400 disabled:opacity-60"
            >
              {saving ? "Salvo..." : "Crea profilo"}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  )
}