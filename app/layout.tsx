import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { FloatingGlyphs } from "@/components/floating-glyphs"

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
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="relative min-h-screen overflow-hidden bg-black text-white">
          <FloatingGlyphs />
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  )
}