import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { BackgroundLayer } from "@/components/background-layer"

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
  return (
    <html lang="it">
      <body className={`${inter.variable} font-sans antialiased bg-black text-white`}>
        <div className="relative min-h-screen overflow-hidden bg-black text-white">
          <BackgroundLayer />
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  )
}