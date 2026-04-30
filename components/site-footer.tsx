"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useLocale } from "@/components/locale-provider"

type GoogleFcWindow = Window & {
  googlefc?: {
    callbackQueue?: Array<() => void>
    showRevocationMessage?: () => void
  }
}

export function SiteFooter() {
  const { locale } = useLocale()
  const [consentAvailable, setConsentAvailable] = useState(false)

  useEffect(() => {
    const checkConsentApi = () => {
      const googleWindow = window as GoogleFcWindow

      const isAvailable =
        typeof googleWindow.googlefc?.callbackQueue?.push === "function" &&
        typeof googleWindow.googlefc?.showRevocationMessage === "function"

      setConsentAvailable(isAvailable)
    }

    checkConsentApi()

    const interval = window.setInterval(checkConsentApi, 500)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  const handleConsentClick = () => {
    const googleWindow = window as GoogleFcWindow
    const callbackQueue = googleWindow.googlefc?.callbackQueue
    const showRevocationMessage = googleWindow.googlefc?.showRevocationMessage

    if (
      typeof callbackQueue?.push === "function" &&
      typeof showRevocationMessage === "function"
    ) {
      callbackQueue.push(showRevocationMessage)
    } else {
      console.warn("Google Funding Choices non è ancora disponibile.")
    }
  }

  return (
    <footer className="border-t border-white/10 bg-black px-6 py-8 text-sm text-white/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p>Linguo</p>
          <p className="mt-1 text-xs text-white/40">
            Impara le lingue senza perdere completamente fiducia nell’umanità.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link href={`/${locale}/privacy`} className="hover:text-white">
            Privacy Policy
          </Link>

          <Link href={`/${locale}/cookie`} className="hover:text-white">
            Cookie Policy
          </Link>

          <button
            type="button"
            onClick={handleConsentClick}
            disabled={!consentAvailable}
            className="hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Gestisci consenso
          </button>
        </div>
      </div>
    </footer>
  )
}