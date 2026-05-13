import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import type { ReactNode } from "react"

import "./globals.css"

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

import { AppSidebar } from "@/components/app-sidebar"
import { AuthProvider } from "@/components/auth-provider"
import { BackgroundLayer } from "@/components/background-layer"
import { LanguageSwitcher } from "@/components/language-switcher"
import { LocaleProvider } from "@/components/locale-provider"
import { SiteFooter } from "@/components/site-footer"
import { ToastProvider } from "@/components/toast-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const rawAdsenseClient =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-9077490381225909"

const adsenseClient = rawAdsenseClient.startsWith("ca-")
  ? rawAdsenseClient
  : `ca-${rawAdsenseClient}`

export const metadata: Metadata = {
  metadataBase: new URL("https://linguo.online"),
  title: {
    default: "Linguo",
    template: "%s | Linguo",
  },
  description:
    "Indovina la lingua. Sfida i tuoi amici, gioca la Daily Word e scala la classifica ranked.",
  referrer: "strict-origin-when-cross-origin",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#020403",
  colorScheme: "dark",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body
        className={`${inter.variable} bg-[#020403] text-white antialiased`}
      >
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        <ToastProvider>
          <AuthProvider>
            <LocaleProvider>
              <div className="relative min-h-[100svh] overflow-x-hidden bg-[#020403] text-white">
                <BackgroundLayer />

                <AppSidebar />

                <div
                  className="pointer-events-none fixed right-4 z-[70]"
                  style={{
                    top: "max(1rem, env(safe-area-inset-top))",
                  }}
                >
                  <div className="pointer-events-auto">
                    <LanguageSwitcher />
                  </div>
                </div>

                <div className="relative z-10 flex min-h-[100svh] flex-col md:pl-[270px]">
                  <div className="flex-1">{children}</div>
                  <SiteFooter />
                </div>
              </div>

              <Analytics />
              <SpeedInsights />
            </LocaleProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}