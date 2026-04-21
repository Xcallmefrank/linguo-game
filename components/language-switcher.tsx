"use client"

import { AppLocale } from "@/lib/i18n"
import { useLocale } from "@/components/locale-provider"

const options: { value: AppLocale; label: string; short: string }[] = [
  { value: "it", label: "Italiano", short: "IT" },
  { value: "en", label: "English", short: "EN" },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-xl">
      {options.map((option) => {
        const active = locale === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLocale(option.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              active
                ? "bg-green-500 text-black"
                : "text-zinc-300 hover:bg-white/5 hover:text-white"
            }`}
            aria-label={option.label}
            title={option.label}
          >
            {option.short}
          </button>
        )
      })}
    </div>
  )
}