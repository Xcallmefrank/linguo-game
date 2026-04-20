"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

type AdSenseBannerProps = {
  slot: string
  className?: string
}

export function AdSenseBanner({
  slot,
  className = "",
}: AdSenseBannerProps) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.replace("ca-pub-", "")

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (error) {
      console.error("Errore AdSense:", error)
    }
  }, [])

  if (!client || !slot) {
    return (
      <div
        className={`flex min-h-24 w-full items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/60 px-4 py-6 text-sm text-zinc-500 ${className}`}
      >
        Spazio pubblicitario
      </div>
    )
  }

  return (
    <div
      className={`overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/70 ${className}`}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={`ca-pub-${client}`}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}