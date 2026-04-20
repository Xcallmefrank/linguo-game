import { Suspense } from "react"
import PlayClient from "./play-client"

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen">
          <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 py-8">
            <div className="rounded-[36px] border border-white/10 bg-black/40 p-6 text-center text-zinc-400 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
              Caricamento...
            </div>
          </div>
        </main>
      }
    >
      <PlayClient />
    </Suspense>
  )
}