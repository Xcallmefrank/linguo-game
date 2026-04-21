import Image from "next/image"
import { useLocale } from "@/components/locale-provider"

type ResultShareCardProps = {
  nickname: string
  score: number
  total: number
  modeLabel: string
  message: string
}

const glyphs = ["あ", "Ж", "字", "ع", "한", "語", "Б", "ナ", "م", "글"]

export function ResultShareCard({
  nickname,
  score,
  total,
  modeLabel,
  message,
}: ResultShareCardProps) {
  const { locale } = useLocale()

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/50 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        {glyphs.map((glyph, index) => (
          <span
            key={`${glyph}-${index}`}
            className="absolute text-2xl font-semibold text-green-400/70"
            style={{
              top: `${10 + (index % 5) * 18}%`,
              left: `${8 + (index % 5) * 18}%`,
              transform: `rotate(${index % 2 === 0 ? -10 : 8}deg)`,
            }}
          >
            {glyph}
          </span>
        ))}
      </div>

      <div className="relative z-10 space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-400/30 bg-gradient-to-br from-green-500/20 to-black p-2 shadow-[0_12px_35px_rgba(34,197,94,0.16)]">
            <div className="relative h-11 w-11">
              <Image
                src="/linguo-icon.png"
                alt="Linguo logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
              Linguo
            </p>
            <p className="text-sm font-medium text-green-400">{modeLabel}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            {nickname}
          </h2>
          <p className="text-5xl font-bold tracking-tight text-green-400">
            {score}/{total}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4">
          <p className="text-base leading-7 text-zinc-200">{message}</p>
        </div>

        <p className="text-sm text-zinc-500">
          {locale === "en"
            ? "Recognize the language. Beat your friends."
            : "Riconosci la lingua. Batti i tuoi amici."}
        </p>
      </div>
    </div>
  )
}