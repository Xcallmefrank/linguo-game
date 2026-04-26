"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/toast-provider"
import { COUNTRIES } from "@/lib/countries"
import { createMyProfile, getMyProfile, isNicknameAvailable } from "@/lib/profile"
import { validateNickname } from "@/lib/nickname-filter"

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
          router.replace("/")
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
      router.replace("/ranked")
    } catch (error) {
      console.error(error)
      showToast("Non sono riuscito a creare il profilo.", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 py-8">
        <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                profilo
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Completa il tuo profilo
              </h1>
              <p className="text-sm leading-6 text-zinc-400">
                Scegli un nickname unico e il tuo paese.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm text-zinc-300">Nickname</label>

              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={14}
                className="w-full rounded-2xl border-zinc-700 bg-zinc-950/80 px-5 py-4 text-center text-base text-white shadow-inner placeholder:text-zinc-500"
              />

              <label className="block pt-1 text-sm text-zinc-300">Paese</label>

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
                onClick={handleSaveProfile}
                disabled={nickname.trim().length < 3 || saving}
                className="h-12 w-full rounded-2xl bg-green-500 text-base font-medium text-black transition-all duration-200 hover:bg-green-400 disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {saving ? "Salvo..." : "Crea profilo"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}