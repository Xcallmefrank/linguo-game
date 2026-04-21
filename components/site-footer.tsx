"use client"

import Link from "next/link"

export function SiteFooter() {
  const handleConsentClick = () => {
    try {
      const googlefc = (window as Window & {
        googlefc?: {
          callbackQueue?: Array<unknown>
          showRevocationMessage?: () => void
        }
      }).googlefc

      if (
        googlefc &&
        googlefc.callbackQueue &&
        typeof googlefc.showRevocationMessage === "function"
      ) {
        googlefc.callbackQueue.push(googlefc.showRevocationMessage)
        return
      }
    } catch (error) {
      console.error("Errore apertura consenso:", error)
    }

    alert("Le impostazioni di consenso non sono ancora disponibili.")
  }

  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/30 px-5 py-6 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
        <p className="text-xs text-zinc-500">
          Linguo · Riconosci la lingua. Batti i tuoi amici.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-zinc-400">
          <Link href="/privacy" className="transition-colors hover:text-white">
            Privacy
          </Link>

          <button
            type="button"
            onClick={handleConsentClick}
            className="transition-colors hover:text-white"
          >
            Gestisci consenso
          </button>
        </div>
      </div>
    </footer>
  )
}