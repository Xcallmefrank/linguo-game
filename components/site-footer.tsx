"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useToast } from "@/components/toast-provider"
import { useLocale } from "@/components/locale-provider"

type GoogleFcWindow = Window & {
  googlefc?: {
    callbackQueue?: Array<() => void>
    showRevocationMessage?: () => void
  }
}

export function SiteFooter() {
  const [consentReady, setConsentReady] = useState(false)
  const { showToast } = useToast()
  const { t } = useLocale()

  useEffect(() => {
    const checkGoogleConsent = () => {
      const googleWindow = window as GoogleFcWindow

      if (
        googleWindow.googlefc &&
        googleWindow.googlefc.callbackQueue &&
        typeof googleWindow.googlefc.showRevocationMessage === "function"
      ) {
        setConsentReady(true)
      }
    }

    checkGoogleConsent()

    const interval = setInterval(checkGoogleConsent, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleConsentClick = () => {
    const googleWindow = window as GoogleFcWindow

    if (
      googleWindow.googlefc &&
      googleWindow.googlefc.callbackQueue &&
      typeof googleWindow.googlefc.showRevocationMessage === "function"
    ) {
      googleWindow.googlefc.callbackQueue.push(
        googleWindow.googlefc.showRevocationMessage
      )
      return
    }

    showToast(t("toast.consentUnavailable"), "info")
  }

  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/30 px-5 py-6 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
        <p className="text-xs text-zinc-500">{t("footer.tagline")}</p>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-zinc-400">
          <Link href="/privacy" className="transition-colors hover:text-white">
            {t("footer.privacy")}
          </Link>

          <button
            type="button"
            onClick={handleConsentClick}
            disabled={!consentReady}
            className="transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("footer.consent")}
          </button>
        </div>
      </div>
    </footer>
  )
}