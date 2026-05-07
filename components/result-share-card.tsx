import { Card } from "@/components/card"

type ResultShareCardProps = {
  nickname: string
  score: number
  total: number
  modeLabel: string
  resultMessage: string
  bestStreak: number
  nonLatinCorrect: number
  bestFamily: {
    label: string
    correct: number
    total: number
  } | null
  locale: "it" | "en"
}

export function ResultShareCard({
  nickname,
  score,
  total,
  modeLabel,
  resultMessage,
  bestStreak,
  nonLatinCorrect,
  bestFamily,
  locale,
}: ResultShareCardProps) {
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0

  return (
    <Card className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#050805] p-7 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,197,94,0.18),transparent_36%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.045),transparent)]" />

      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-green-300">
              Linguo
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              {locale === "en" ? "Result card" : "Card risultato"}
            </h2>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-2xl">
            L
          </div>
        </div>

        <div className="mt-8 rounded-[30px] border border-white/10 bg-black/35 p-6 text-center">
          <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
            {modeLabel}
          </p>

          <h1 className="mt-4 truncate text-4xl font-semibold tracking-tight text-white">
            {nickname}
          </h1>

          <p className="mt-5 text-7xl font-semibold tracking-tight text-green-400">
            {score}/{total}
          </p>

          <p className="mt-3 text-sm font-medium text-zinc-400">
            {accuracy}% {locale === "en" ? "accuracy" : "precisione"}
          </p>

          <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-zinc-300">
            {resultMessage}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <ResultShareStat
            label={locale === "en" ? "Best streak" : "Serie migliore"}
            value={bestStreak}
          />

          <ResultShareStat
            label={locale === "en" ? "Non-Latin" : "Non latino"}
            value={nonLatinCorrect}
          />

          <ResultShareStat
            label={locale === "en" ? "Best family" : "Famiglia top"}
            value={
              bestFamily
                ? `${bestFamily.label} ${bestFamily.correct}/${bestFamily.total}`
                : "-"
            }
          />
        </div>

        <div className="mt-6 rounded-2xl border border-green-500/15 bg-green-500/10 px-4 py-4 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-green-300">
            linguo.online
          </p>

          <p className="mt-2 text-sm text-zinc-300">
            {locale === "en"
              ? "Challenge friends and compare your score."
              : "Sfida gli amici e confronta il tuo punteggio."}
          </p>
        </div>
      </div>
    </Card>
  )
}

function ResultShareStat({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/75 p-3 text-center">
      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>

      <p className="mt-2 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

export default ResultShareCard