"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useToast } from "@/components/toast-provider"
import { useLocale } from "@/components/locale-provider"

type GoogleFcWindow = Window & {
  googlefc?: {
    callbackQueue?: {
      push: (item: unknown) => number
    }
    showRevocationMessage?: () => void
  }
}

function isConsentApiReady(googleWindow: GoogleFcWindow) {
  return Boolean(
    googleWindow.googlefc?.callbackQueue &&
      typeof googleWindow.googlefc?.showRevocationMessage === "function"
  )
}

export function SiteFooter() {
  const [consentReady, setConsentReady] = useState(false)
  const { showToast } = useToast()
  const { t } = useLocale()

  useEffect(() => {
    if (typeof window === "undefined") return

    const googleWindow = window as GoogleFcWindow

    googleWindow.googlefc = googleWindow.googlefc || {}
    googleWindow.googlefc.callbackQueue =
      googleWindow.googlefc.callbackQueue || {
        push: () => 0,
      }

    if (isConsentApiReady(googleWindow)) {
      setConsentReady(true)
      return
    }

    const queue = googleWindow.googlefc.callbackQueue

    queue.push({
      CONSENT_API_READY: () => {
        setConsentReady(true)
      },
    })

    const interval = window.setInterval(() => {
      if (isConsentApiReady(googleWindow)) {
        setConsentReady(true)
        window.clearInterval(interval)
      }
    }, 800)

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval)
    }, 10000)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [])

  const handleConsentClick = () => {
    const googleWindow = window as GoogleFcWindow

    if (
      googleWindow.googlefc?.callbackQueue &&
      typeof googleWindow.googlefc.showRevocationMessage === "function"
    ) {
      const queue = googleWindow.googlefc.callbackQueue
      const showRevocationMessage = googleWindow.googlefc.showRevocationMessage
      queue.push(showRevocationMessage)
      return
    }

    showToast(t("toast.consentUnavailable"), "info")
  }

  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/30 px-5 py-6 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
        <p className="text-[11px] tracking-[0.08em] text-zinc-600">
          Made by Xeryon
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-zinc-400">
          <Link href="/privacy" className="transition-colors hover:text-white">
            {t("footer.privacy")}
          </Link>

          <button
            type="button"
            onClick={handleConsentClick}
            className={`transition-colors hover:text-white ${
              consentReady ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
            {t("footer.consent")}
          </button>
        </div>
      </div>
    </footer>
  )
}