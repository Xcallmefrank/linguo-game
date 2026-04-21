import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { BackgroundLayer } from "@/components/background-layer"
import { SiteFooter } from "@/components/site-footer"
import { ToastProvider } from "@/components/toast-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "Linguo",
    template: "%s | Linguo",
  },
  description: "Indovina la lingua. Sfida i tuoi amici.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

  return (
    <html lang="it">
      <body className={`${inter.variable} font-sans antialiased text-white`}>
        {adsenseClient ? (
          <Script
            id="adsense-script"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        ) : null}

        <ToastProvider>
          <div className="relative min-h-screen overflow-x-hidden text-white">
            <BackgroundLayer />
            <div className="relative z-10 flex min-h-screen flex-col">
              <div className="flex-1">{children}</div>
              <SiteFooter />
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}