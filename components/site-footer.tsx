"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { useLocale } from "@/components/locale-provider"
import { useToast } from "@/components/toast-provider"
import { trackEvent } from "@/lib/analytics"

type GoogleFcWindow = Window & {
  googlefc?: {
    callbackQueue?: Array<() => void>
    showRevocationMessage?: () => void
  }
}

export function SiteFooter() {
  const { locale } = useLocale()
  const { showToast } = useToast()

  const [consentReady, setConsentReady] = useState(false)

  useEffect(() => {
    const checkConsentAvailability = () => {
      const googleWindow = window as GoogleFcWindow

      const callbackQueue = googleWindow.googlefc?.callbackQueue
      const showRevocationMessage = googleWindow.googlefc?.showRevocationMessage

      setConsentReady(
        typeof callbackQueue?.push === "function" &&
          typeof showRevocationMessage === "function"
      )
    }

    checkConsentAvailability()

    const interval = window.setInterval(checkConsentAvailability, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  const handleConsentClick = () => {
    trackEvent("consent_click", {
      source: "footer",
      available: consentReady,
    })

    const googleWindow = window as GoogleFcWindow

    const callbackQueue = googleWindow.googlefc?.callbackQueue
    const showRevocationMessage = googleWindow.googlefc?.showRevocationMessage

    if (
      typeof callbackQueue?.push === "function" &&
      typeof showRevocationMessage === "function"
    ) {
      callbackQueue.push(showRevocationMessage)
      return
    }

    showToast(
      locale === "en"
        ? "Consent settings are not available yet."
        : "Le impostazioni del consenso non sono ancora disponibili.",
      "error"
    )
  }

  return (
    <footer className="w-full border-t border-white/10 bg-black/30 px-5 py-8 backdrop-blur-xl">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr_1fr] md:items-start">
          <div className="space-y-3 text-center md:text-left">
            <p className="text-sm font-semibold tracking-tight text-white">
              Linguo
            </p>

            <p className="max-w-sm text-xs leading-5 text-zinc-500 md:max-w-none">
              {locale === "en"
                ? "A language game built around quick runs, daily challenges and ranked progression."
                : "Un gioco linguistico costruito intorno a partite veloci, sfide quotidiane e progressione ranked."}
            </p>

            <p className="text-xs text-zinc-600">
              Made by{" "}
              <span className="font-medium text-zinc-400">Xeryon</span>
            </p>
          </div>

          <FooterGroup
            title={locale === "en" ? "Game modes" : "Modalità"}
            items={[
              {
                href: "/quick-play",
                label: locale === "en" ? "Quick Play" : "Partita veloce",
              },
              {
                href: "/daily-word",
                label: "Daily Word",
              },
              {
                href: "/ranked-mode",
                label: "Ranked",
              },
            ]}
          />

          <div className="space-y-3 text-center md:text-left">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-600">
              {locale === "en" ? "Information" : "Informazioni"}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <Link
                href="/privacy"
                onClick={() =>
                  trackEvent("nav_click", {
                    source: "footer",
                    label: "Privacy",
                    target: "/privacy",
                  })
                }
                className="rounded-full border border-white/10 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-500 transition-colors hover:border-green-500/30 hover:text-green-300"
              >
                Privacy
              </Link>

              <button
                type="button"
                onClick={handleConsentClick}
                className={`rounded-full border px-3 py-2 text-xs transition-colors ${
                  consentReady
                    ? "border-white/10 bg-zinc-950/60 text-zinc-500 hover:border-green-500/30 hover:text-green-300"
                    : "border-white/5 bg-zinc-950/40 text-zinc-700"
                }`}
              >
                {locale === "en" ? "Manage consent" : "Gestisci consenso"}
              </button>

              <a
                href="mailto:contact@noyrex.com"
                onClick={() =>
                  trackEvent("contact_click", {
                    source: "footer",
                    target: "contact@noyrex.com",
                  })
                }
                className="rounded-full border border-white/10 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-500 transition-colors hover:border-green-500/30 hover:text-green-300"
              >
                contact@noyrex.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="mt-5 flex flex-col items-center justify-between gap-3 text-center text-[11px] text-zinc-700 md:flex-row md:text-left">
          <p>
            © {new Date().getFullYear()} Linguo.{" "}
            {locale === "en"
              ? "All rights reserved."
              : "Tutti i diritti riservati."}
          </p>

          <p>
            {locale === "en"
              ? "Built for language learning, daily practice and friendly challenges."
              : "Creato per apprendimento linguistico, pratica quotidiana e sfide tra amici."}
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterGroup({
  title,
  items,
}: {
  title: string
  items: {
    href: string
    label: string
  }[]
}) {
  return (
    <div className="space-y-3 text-center md:text-left">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-600">
        {title}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() =>
              trackEvent("nav_click", {
                source: "footer",
                label: item.label,
                target: item.href,
              })
            }
            className="rounded-full border border-white/10 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-500 transition-colors hover:border-green-500/30 hover:text-green-300"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default SiteFooter