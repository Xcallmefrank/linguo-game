"use client"

import { useEffect } from "react"
import { Card } from "@/components/card"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default function AuthCallbackPage() {
  useEffect(() => {
    let cancelled = false

    const goHome = () => {
      if (!cancelled) {
        window.location.replace("/")
      }
    }

    const handleAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get("code")

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error("Errore exchange session:", error)
          }
        } else {
          await supabase.auth.getSession()
        }
      } catch (error) {
        console.error("Errore callback auth:", error)
      } finally {
        goHome()
      }
    }

    const timeout = window.setTimeout(() => {
      goHome()
    }, 1800)

    void handleAuth()

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [])

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 py-8">
        <Card className="w-full rounded-[36px] border border-white/10 bg-black/40 p-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              accesso
            </p>
            <p className="text-base text-zinc-300">Sto completando il login...</p>
          </div>
        </Card>
      </div>
    </main>
  )
}