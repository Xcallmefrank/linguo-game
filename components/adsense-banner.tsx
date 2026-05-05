"use client"

import { useEffect } from "react"

type AdSenseBannerProps = {
  slot: string
  className?: string
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical"
  responsive?: boolean
}

type AdSenseWindow = Window & {
  adsbygoogle?: unknown[]
}

const ADS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ADS === "true"

const RAW_ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-9077490381225909"

const ADSENSE_CLIENT = RAW_ADSENSE_CLIENT.startsWith("ca-")
  ? RAW_ADSENSE_CLIENT
  : `ca-${RAW_ADSENSE_CLIENT}`

export function AdSenseBanner({
  slot,
  className = "",
  format = "auto",
  responsive = true,
}: AdSenseBannerProps) {
  useEffect(() => {
    if (!ADS_ENABLED) return

    try {
      const adsWindow = window as AdSenseWindow
      adsWindow.adsbygoogle = adsWindow.adsbygoogle || []
      adsWindow.adsbygoogle.push({})
    } catch (error) {
      console.error("Errore caricamento AdSense:", error)
    }
  }, [slot])

  if (!ADS_ENABLED) {
    return null
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle block"
        style={{
          display: "block",
        }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  )
}

export default AdSenseBanner