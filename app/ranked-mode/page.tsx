"use client"

import Link from "next/link"
import { motion } from "motion/react"

import { Button } from "@/components/button"
import { Card } from "@/components/card"
import { useLocale } from "@/components/locale-provider"

export default function RankedModePage() {
  const { locale } = useLocale()
  const isEnglish = locale === "en"

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="h-10 rounded-full border border-zinc-800 bg-black/30 px-4 py-2 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
          >
            ← {isEnglish ? "Back home" : "Torna alla home"}
          </Link>

          <div className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-red-300">
            Ranked
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Card className="relative overflow-hidden rounded-[40px] border border-white/10 bg-black/40 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(220,38,38,0.16),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(255,255,255,0.1),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent)]" />

            <div className="relative grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-red-300">
                  {isEnglish ? "Competitive mode" : "Modalità competitiva"}
                </p>

                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-6xl">
                  {isEnglish
                    ? "Enter the global ranking."
                    : "Entra nella classifica globale."}
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
                  {isEnglish
                    ? "Ranked is Linguo’s competitive mode: complete official runs, compare your average score and climb the global Top 25."
                    : "Ranked è la modalità competitiva di Linguo: completa run ufficiali, confronta il tuo punteggio medio e scala la Top 25 globale."}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={() => {
                      window.location.href = "/ranked"
                    }}
                    className="h-12 rounded-2xl bg-green-500 px-6 text-base font-semibold text-black transition-all duration-200 hover:bg-green-400"
                  >
                    {isEnglish ? "Open Ranked" : "Apri Ranked"}
                  </Button>

                  <Link
                    href="/quick-play"
                    className="flex h-12 items-center justify-center rounded-2xl border border-zinc-800 bg-transparent px-6 text-base font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
                  >
                    {isEnglish ? "Quick Play" : "Partita veloce"}
                  </Link>
                </div>
              </div>

              <div className="rounded-[34px] border border-red-500/20 bg-zinc-950/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/45 p-5">
                  <div className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(135deg,rgba(127,29,29,0.72),rgba(220,38,38,0.48))]" />
                  <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden bg-zinc-950">
                    <div
                      className="absolute inset-[-10%] opacity-80"
                      style={{
                        backgroundImage:
                          "linear-gradient(45deg, rgba(255,255,255,0.95) 25%, rgba(12,12,12,0.98) 25%, rgba(12,12,12,0.98) 50%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.95) 75%, rgba(12,12,12,0.98) 75%, rgba(12,12,12,0.98) 100%)",
                        backgroundSize: "22px 22px",
                        transform: "skewX(-14deg) scale(1.08)",
                      }}
                    />
                  </div>

                  <div className="relative z-10">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-200">
                      Top 25
                    </p>

                    <h2 className="mt-4 text-3xl font-semibold text-white">
                      Global Ranked
                    </h2>

                    <div className="mt-6 space-y-3">
                      {[
                        ["#1", "Player A", "9.7"],
                        ["#2", "Player B", "9.4"],
                        ["#3", "Player C", "9.1"],
                      ].map(([position, name, score]) => (
                        <div
                          key={position}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/55 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-red-300">
                              {position}
                            </span>
                            <span className="text-sm font-medium text-white">
                              {name}
                            </span>
                          </div>

                          <span className="text-sm font-semibold text-green-300">
                            {score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <FeatureCard
            title={isEnglish ? "Official runs" : "Run ufficiali"}
            text={
              isEnglish
                ? "Ranked runs are tracked separately from casual games and contribute to your competitive profile."
                : "Le run ranked sono tracciate separatamente dalle partite casuali e contribuiscono al tuo profilo competitivo."
            }
          />

          <FeatureCard
            title={isEnglish ? "Average performance" : "Prestazione media"}
            text={
              isEnglish
                ? "Your ranking is based on consistency, not only on a single lucky result."
                : "La posizione in classifica si basa sulla costanza, non solo su un singolo risultato fortunato."
            }
          />

          <FeatureCard
            title={isEnglish ? "Global Top 25" : "Top 25 globale"}
            text={
              isEnglish
                ? "Compare yourself with other players and aim for a visible position in the global ranking."
                : "Confrontati con altri giocatori e punta a una posizione visibile nella classifica globale."
            }
          />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-[34px] border border-white/10 bg-black/40 p-6 shadow-[0_14px_42px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {isEnglish ? "How it works" : "Come funziona"}
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-white">
              {isEnglish
                ? "A structured competitive flow."
                : "Un flusso competitivo strutturato."}
            </h2>

            <div className="mt-6 space-y-4">
              <Step
                number="01"
                title={isEnglish ? "Sign in" : "Accedi"}
                text={
                  isEnglish
                    ? "Ranked requires an account so your official runs can be linked to your profile."
                    : "La Ranked richiede l’accesso per collegare le run ufficiali al tuo profilo."
                }
              />

              <Step
                number="02"
                title={isEnglish ? "Complete official runs" : "Completa le run ufficiali"}
                text={
                  isEnglish
                    ? "Each run contributes to your competitive statistics and seasonal standing."
                    : "Ogni run contribuisce alle statistiche competitive e alla posizione stagionale."
                }
              />

              <Step
                number="03"
                title={isEnglish ? "Climb the ranking" : "Scala la classifica"}
                text={
                  isEnglish
                    ? "Improve your average score and time to reach a stronger position."
                    : "Migliora punteggio medio e tempo per raggiungere una posizione più alta."
                }
              />
            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-[34px] border border-red-500/15 bg-black/40 p-6 shadow-[0_14px_42px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(220,38,38,0.13),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent)]" />

            <div className="relative">
              <p className="text-xs uppercase tracking-[0.2em] text-red-300">
                {isEnglish ? "Competitive value" : "Valore competitivo"}
              </p>

              <h2 className="mt-3 text-2xl font-semibold text-white">
                {isEnglish
                  ? "Designed for players who want a measurable challenge."
                  : "Pensata per chi cerca una sfida misurabile."}
              </h2>

              <p className="mt-4 text-sm leading-7 text-zinc-300">
                {isEnglish
                  ? "Ranked gives Linguo a competitive layer: players can track their official performance, compare results and return to improve their standing."
                  : "La Ranked aggiunge a Linguo un livello competitivo: i giocatori possono seguire le prestazioni ufficiali, confrontare i risultati e tornare per migliorare la posizione."}
              </p>

              <div className="mt-6 grid gap-3">
                <InfoRow label={isEnglish ? "Access" : "Accesso"} value={isEnglish ? "Account required" : "Account richiesto"} />
                <InfoRow label={isEnglish ? "Goal" : "Obiettivo"} value="Top 25" />
                <InfoRow label={isEnglish ? "Focus" : "Focus"} value={isEnglish ? "Consistency" : "Costanza"} />
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-8">
          <Card className="rounded-[34px] border border-white/10 bg-black/40 p-6 text-center shadow-[0_14px_42px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {isEnglish ? "Compete" : "Competizione"}
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-white">
              {isEnglish ? "Start your ranked run." : "Inizia la tua run ranked."}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              {isEnglish
                ? "Enter Ranked, complete your official runs and track your position over time."
                : "Entra nella Ranked, completa le run ufficiali e segui la tua posizione nel tempo."}
            </p>

            <Button
              onClick={() => {
                window.location.href = "/ranked"
              }}
              className="mt-6 h-12 rounded-2xl bg-green-500 px-8 text-base font-semibold text-black transition-all duration-200 hover:bg-green-400"
            >
              {isEnglish ? "Go to Ranked" : "Vai alla Ranked"}
            </Button>
          </Card>
        </section>
      </div>
    </main>
  )
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <Card className="rounded-[30px] border border-white/10 bg-black/40 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p>
    </Card>
  )
}

function Step({
  number,
  title,
  text,
}: {
  number: string
  title: string
  text: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
      <p className="text-xs font-semibold tracking-[0.18em] text-red-300">
        {number}
      </p>

      <h3 className="mt-2 text-base font-semibold text-white">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-right text-sm font-medium text-white">{value}</span>
    </div>
  )
}