"use client"

import Link from "next/link"
import { motion } from "motion/react"

import { Card } from "@/components/card"
import { Button } from "@/components/button"
import { useLocale } from "@/components/locale-provider"

export default function DailyWordPage() {
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
            Daily Word
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Card className="relative overflow-hidden rounded-[40px] border border-white/10 bg-black/40 p-7 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(34,197,94,0.16),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(250,204,21,0.1),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent)]" />

            <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-green-300">
                  {isEnglish ? "Daily language challenge" : "Sfida linguistica quotidiana"}
                </p>

                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-6xl">
                  {isEnglish ? "One hidden word every day." : "Una parola nascosta ogni giorno."}
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
                  {isEnglish
                    ? "Daily Word is Linguo’s daily challenge: one mystery word, one question, one chance to keep your streak alive."
                    : "Daily Word è la sfida quotidiana di Linguo: una parola misteriosa, una domanda e una possibilità per mantenere viva la tua serie."}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={() => {
                      window.location.href = "/daily"
                    }}
                    className="h-12 rounded-2xl bg-green-500 px-6 text-base font-semibold text-black transition-all duration-200 hover:bg-green-400"
                  >
                    {isEnglish ? "Play today’s Daily" : "Gioca la Daily di oggi"}
                  </Button>

                  <Link
                    href="/"
                    className="flex h-12 items-center justify-center rounded-2xl border border-zinc-800 bg-transparent px-6 text-base font-medium text-zinc-300 transition-all duration-200 hover:bg-zinc-900"
                  >
                    {isEnglish ? "Explore Linguo" : "Esplora Linguo"}
                  </Link>
                </div>
              </div>

              <div className="rounded-[34px] border border-green-500/20 bg-zinc-950/75 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="rounded-[28px] border border-white/10 bg-black/45 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {isEnglish ? "Example" : "Esempio"}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-3xl font-semibold text-white">
                        {isEnglish ? "Mystery word" : "Parola misteriosa"}
                      </p>

                      <p className="mt-2 text-sm text-zinc-400">
                        {isEnglish
                          ? "Revealed only after the answer"
                          : "Rivelata solo dopo la risposta"}
                      </p>
                    </div>

                    <div className="text-5xl">🏠</div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {isEnglish ? "Question" : "Domanda"}
                    </p>

                    <p className="mt-3 text-lg font-medium leading-7 text-white">
                      {isEnglish
                        ? "Which language uses “Haus”?"
                        : "In quale lingua si dice “Haus”?"}
                    </p>

                    <div className="mt-4 grid gap-2">
                      {[
                        isEnglish ? "German" : "Tedesco",
                        isEnglish ? "French" : "Francese",
                        isEnglish ? "Spanish" : "Spagnolo",
                        isEnglish ? "Russian" : "Russo",
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
                </div>
              </div>
            </div>
          </Card>
        </motion.section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <FeatureCard
            title={isEnglish ? "A daily habit" : "Un’abitudine quotidiana"}
            text={
              isEnglish
                ? "Every day introduces a new word and a new linguistic connection to discover."
                : "Ogni giorno introduce una nuova parola e una nuova connessione linguistica da scoprire."
            }
          />

          <FeatureCard
            title={isEnglish ? "Streak and progress" : "Serie e progressi"}
            text={
              isEnglish
                ? "Complete the Daily Word to keep your streak active and track your progress over time."
                : "Completa la Daily Word per mantenere attiva la tua serie e seguire i progressi nel tempo."
            }
          />

          <FeatureCard
            title={isEnglish ? "Challenge friends" : "Sfida gli amici"}
            text={
              isEnglish
                ? "Share your result and invite friends to solve the same daily challenge."
                : "Condividi il risultato e invita gli amici a risolvere la stessa sfida quotidiana."
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
                ? "A short challenge designed for consistency."
                : "Una sfida breve pensata per la costanza."}
            </h2>

            <div className="mt-6 space-y-4">
              <Step
                number="01"
                title={isEnglish ? "Open the Daily Hub" : "Apri la Daily Hub"}
                text={
                  isEnglish
                    ? "View your path, streak, current status and countdown to the next daily."
                    : "Visualizza il percorso, la serie, lo stato del giorno e il countdown alla prossima daily."
                }
              />

              <Step
                number="02"
                title={isEnglish ? "Answer one question" : "Rispondi a una domanda"}
                text={
                  isEnglish
                    ? "The word stays hidden until the end, so the challenge remains focused."
                    : "La parola resta nascosta fino alla fine, così la sfida rimane più interessante."
                }
              />

              <Step
                number="03"
                title={isEnglish ? "Reveal and share" : "Scopri e condividi"}
                text={
                  isEnglish
                    ? "After the answer, Linguo reveals the word and lets you challenge a friend."
                    : "Dopo la risposta, Linguo rivela la parola e ti permette di sfidare un amico."
                }
              />
            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-[34px] border border-green-500/15 bg-black/40 p-6 shadow-[0_14px_42px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,197,94,0.13),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent)]" />

            <div className="relative">
              <p className="text-xs uppercase tracking-[0.2em] text-green-300">
                {isEnglish ? "Why it matters" : "Perché è utile"}
              </p>

              <h2 className="mt-3 text-2xl font-semibold text-white">
                {isEnglish
                  ? "It helps you notice patterns between languages."
                  : "Ti aiuta a riconoscere collegamenti tra le lingue."}
              </h2>

              <p className="mt-4 text-sm leading-7 text-zinc-300">
                {isEnglish
                  ? "Daily Word is not only about guessing a translation. It highlights writing systems, language families, borrowed words and similarities that often go unnoticed."
                  : "Daily Word non riguarda solo l’indovinare una traduzione. Evidenzia sistemi di scrittura, famiglie linguistiche, prestiti e somiglianze che spesso passano inosservate."}
              </p>

              <div className="mt-6 grid gap-3">
                <InfoRow
                  label={isEnglish ? "Focus" : "Focus"}
                  value={isEnglish ? "Language awareness" : "Consapevolezza linguistica"}
                />

                <InfoRow
                  label={isEnglish ? "Time" : "Tempo"}
                  value={isEnglish ? "Less than one minute" : "Meno di un minuto"}
                />

                <InfoRow
                  label={isEnglish ? "Goal" : "Obiettivo"}
                  value={isEnglish ? "Return every day" : "Tornare ogni giorno"}
                />
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-8">
          <Card className="rounded-[34px] border border-white/10 bg-black/40 p-6 text-center shadow-[0_14px_42px_rgba(0,0,0,0.42)] backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {isEnglish ? "Ready" : "Pronto"}
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-white">
              {isEnglish
                ? "Start today’s Daily Word."
                : "Inizia la Daily Word di oggi."}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              {isEnglish
                ? "One question is enough to build a habit. The rest is your streak."
                : "Una domanda basta per costruire un’abitudine. Il resto lo fa la tua serie."}
            </p>

            <Button
              onClick={() => {
                window.location.href = "/daily"
              }}
              className="mt-6 h-12 rounded-2xl bg-green-500 px-8 text-base font-semibold text-black transition-all duration-200 hover:bg-green-400"
            >
              {isEnglish ? "Play Daily Word" : "Gioca Daily Word"}
            </Button>
          </Card>
        </section>
      </div>
    </main>
  )
}

function FeatureCard({
  title,
  text,
}: {
  title: string
  text: string
}) {
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
      <p className="text-xs font-semibold tracking-[0.18em] text-green-300">
        {number}
      </p>

      <h3 className="mt-2 text-base font-semibold text-white">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
    </div>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-right text-sm font-medium text-white">{value}</span>
    </div>
  )
}