import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { BackgroundLayer } from "@/components/background-layer"
import { SiteFooter } from "@/components/site-footer"
import { ToastProvider } from "@/components/toast-provider"
import { LocaleProvider } from "@/components/locale-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/auth-provider"
import { AppSidebar } from "@/components/app-sidebar"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://linguo.online"),
  title: {
    default: "Linguo",
    template: "%s | Linguo",
  },
  description: "Indovina la lingua. Sfida i tuoi amici.",
  referrer: "strict-origin-when-cross-origin",
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
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9077490381225909"
            crossOrigin="anonymous"
          />
        ) : null}

        <ToastProvider>
          <AuthProvider>
            <LocaleProvider>
              <div className="relative min-h-screen overflow-x-hidden text-white">
                <BackgroundLayer />

                <AppSidebar />

                <div className="pointer-events-none absolute right-4 top-4 z-[70]">
                  <div className="pointer-events-auto">
                    <LanguageSwitcher />
                  </div>
                </div>

                <div className="relative z-10 flex min-h-screen flex-col md:pl-[270px]">
                  <div className="flex-1">{children}</div>
                  <SiteFooter />
                </div>
              </div>

              <Analytics />
            </LocaleProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}