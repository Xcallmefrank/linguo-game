"use client"

import Link from "next/link"
import { motion } from "motion/react"

import { Button } from "@/components/button"
import { Card } from "@/components/card"
import { useLocale } from "@/components/locale-provider"

export default function QuickPlayPage() {
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

          <div className="rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-green-300">
            Quick Play
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Card className="relative overflow-hidden rounded-[40px] border border-white/10 bg-black/40 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(34,197,94,0.16),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.1),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent)]" />

            <div className="relative grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-green-300">
                  {isEnglish ? "Classic mode" : "Modalità classica"}
                </p>

                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-6xl">
                  {isEnglish
                    ? "Play a fast language challenge."
                    : "Gioca una sfida linguistica veloce."}
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
                  {isEnglish
                    ? "Quick Play is the fastest way to start a Linguo run: choose a mode, answer the questions and discover how well you recognize languages, alphabets and similarities."
                    : "La partita veloce è il modo più immediato per iniziare una run su Linguo: scegli una modalità, rispondi alle domande e scopri quanto riesci a riconoscere lingue, alfabeti e somiglianze."}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={() => {
                      window.location.href = "/"
                    }}
                    className="h-12 rounded-2xl bg-green-500 px-6 text-base font-semibold text-black transition-all duration-200 hover:bg-green-400"
                  >
                    {isEnglish ? "Start playing" : "Inizia a giocare"}
                  </Button>

                  <Link
                    href="/daily-word"
                    className="flex h-12 items-center justify-center rounded-2xl border border-zinc-800 bg-transparent px-6 text-base font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
                  >
                    Daily Word
                  </Link>
                </div>
              </div>

              <div className="rounded-[34px] border border-green-500/20 bg-zinc-950/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="rounded-[28px] border border-white/10 bg-black/45 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {isEnglish ? "Example run" : "Esempio di partita"}
                  </p>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-zinc-950 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {isEnglish ? "Question" : "Domanda"}
                    </p>

                    <p className="mt-3 text-lg font-medium leading-7 text-white">
                      “Guten Morgen”
                    </p>

                    <div className="mt-4 grid gap-2">
                      {[
                        isEnglish ? "German" : "Tedesco",
                        isEnglish ? "French" : "Francese",
                        isEnglish ? "Spanish" : "Spagnolo",
                        isEnglish ? "Japanese" : "Giapponese",
                      ].map((option, index) => (
                        <div
                          key={option}
                          className={`rounded-xl border px-4 py-3 text-sm ${
                            index === 0
                              ? "border-green-500/50 bg-green-500/10 text-green-300"
                              : "border-white/10 bg-black/30 text-zinc-400"
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <MiniStat label={isEnglish ? "Mode" : "Modo"} value="Normal" />
                    <MiniStat label={isEnglish ? "Score" : "Score"} value="8/10" />
                    <MiniStat label={isEnglish ? "Share" : "Sfida"} value="Link" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <FeatureCard
            title={isEnglish ? "Three modes" : "Tre modalità"}
            text={
              isEnglish
                ? "Play Normal, Hard or Similar Languages depending on the kind of challenge you want."
                : "Gioca in modalità Normale, Difficile o Lingue simili in base al tipo di sfida che vuoi affrontare."
            }
          />

          <FeatureCard
            title={isEnglish ? "Immediate feedback" : "Feedback immediato"}
            text={
              isEnglish
                ? "Each answer helps you understand patterns between languages and writing systems."
                : "Ogni risposta ti aiuta a riconoscere collegamenti tra lingue e sistemi di scrittura."
            }
          />

          <FeatureCard
            title={isEnglish ? "Challenge friends" : "Sfida gli amici"}
            text={
              isEnglish
                ? "At the end of a run, create a challenge link and invite a friend to beat your score."
                : "Alla fine della partita, crea un link sfida e invita un amico a superare il tuo punteggio."
            }
          />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-[34px] border border-white/10 bg-black/40 p-6 shadow-[0_14px_42px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {isEnglish ? "Available modes" : "Modalità disponibili"}
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-white">
              {isEnglish
                ? "Choose the kind of run you want."
                : "Scegli il tipo di partita più adatto."}
            </h2>

            <div className="mt-6 space-y-4">
              <InfoBlock
                title={isEnglish ? "Normal" : "Normale"}
                text={
                  isEnglish
                    ? "A balanced run designed to recognize languages through words and phrases."
                    : "Una partita bilanciata per riconoscere le lingue attraverso parole e frasi."
                }
              />

              <InfoBlock
                title={isEnglish ? "Hard" : "Difficile"}
                text={
                  isEnglish
                    ? "A more demanding mode with less obvious choices and harder patterns."
                    : "Una modalità più impegnativa, con opzioni meno immediate e collegamenti più difficili."
                }
              />

              <InfoBlock
                title={isEnglish ? "Similar languages" : "Lingue simili"}
                text={
                  isEnglish
                    ? "A focused challenge built around languages that can easily be confused."
                    : "Una sfida concentrata sulle lingue che possono essere confuse più facilmente."
                }
              />
            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-[34px] border border-green-500/15 bg-black/40 p-6 shadow-[0_14px_42px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,197,94,0.13),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent)]" />

            <div className="relative">
              <p className="text-xs uppercase tracking-[0.2em] text-green-300">
                {isEnglish ? "Why play" : "Perché giocare"}
              </p>

              <h2 className="mt-3 text-2xl font-semibold text-white">
                {isEnglish
                  ? "A quick way to train language recognition."
                  : "Un modo rapido per allenare il riconoscimento linguistico."}
              </h2>

              <p className="mt-4 text-sm leading-7 text-zinc-300">
                {isEnglish
                  ? "Quick Play is designed for short sessions. It helps you notice similarities, scripts and linguistic patterns without requiring long study sessions."
                  : "La partita veloce è pensata per sessioni brevi. Aiuta a notare somiglianze, alfabeti e pattern linguistici senza richiedere lunghi momenti di studio."}
              </p>

              <div className="mt-6 grid gap-3">
                <InfoRow label={isEnglish ? "Session" : "Sessione"} value={isEnglish ? "Fast" : "Veloce"} />
                <InfoRow label={isEnglish ? "Focus" : "Focus"} value={isEnglish ? "Recognition" : "Riconoscimento"} />
                <InfoRow label={isEnglish ? "Best for" : "Ideale per"} value={isEnglish ? "Practice and sharing" : "Allenamento e sfide"} />
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-8">
          <Card className="rounded-[34px] border border-white/10 bg-black/40 p-6 text-center shadow-[0_14px_42px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {isEnglish ? "Start" : "Inizia"}
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-white">
              {isEnglish
                ? "Play your next quick run."
                : "Gioca la tua prossima partita veloce."}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              {isEnglish
                ? "Choose a mode, complete the run and challenge a friend to beat your score."
                : "Scegli una modalità, completa la partita e sfida un amico a superare il tuo punteggio."}
            </p>

            <Button
              onClick={() => {
                window.location.href = "/"
              }}
              className="mt-6 h-12 rounded-2xl bg-green-500 px-8 text-base font-semibold text-black transition-all duration-200 hover:bg-green-400"
            >
              {isEnglish ? "Go to Quick Play" : "Vai alla partita veloce"}
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

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4">
      <h3 className="text-base font-semibold text-white">{title}</h3>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  )
}