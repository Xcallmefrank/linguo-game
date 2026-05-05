"use client"

import { motion } from "motion/react"
import type { DailyAttempt } from "@/lib/daily-sessions"

type DailyTimelineProps = {
  attempts: DailyAttempt[]
  centerKey: string
  todayKey: string
  locale: "it" | "en"
}

type TimelineNode = {
  key: string
  label: string
  sublabel: string
  completed: boolean
  isToday: boolean
  isSelected: boolean
  isFuture: boolean
  isPast: boolean
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function addDays(key: string, amount: number) {
  const date = parseDateKey(key)
  date.setDate(date.getDate() + amount)
  return toDateKey(date)
}

function getDayLabel(key: string, todayKey: string, locale: "it" | "en") {
  if (key === todayKey) return locale === "en" ? "Today" : "Oggi"
  if (key === addDays(todayKey, -1)) return locale === "en" ? "Yesterday" : "Ieri"
  if (key === addDays(todayKey, 1)) return locale === "en" ? "Tomorrow" : "Domani"

  const date = parseDateKey(key)

  return date.toLocaleDateString(locale === "en" ? "en-US" : "it-IT", {
    day: "2-digit",
    month: "short",
  })
}

function getShortDate(key: string, locale: "it" | "en") {
  const date = parseDateKey(key)

  return date.toLocaleDateString(locale === "en" ? "en-US" : "it-IT", {
    day: "2-digit",
    month: "2-digit",
  })
}

function buildNodes({
  attempts,
  centerKey,
  todayKey,
  locale,
}: DailyTimelineProps): TimelineNode[] {
  const completedKeys = new Set(attempts.map((attempt) => attempt.daily_key))

  return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const key = addDays(centerKey, offset)
    const completed = completedKeys.has(key)
    const isToday = key === todayKey
    const isSelected = key === centerKey
    const isFuture = key > todayKey
    const isPast = key < todayKey

    return {
      key,
      label: getDayLabel(key, todayKey, locale),
      sublabel: getShortDate(key, locale),
      completed,
      isToday,
      isSelected,
      isFuture,
      isPast,
    }
  })
}

export function DailyTimeline(props: DailyTimelineProps) {
  const nodes = buildNodes(props)
  const { locale } = props

  return (
    <div className="rounded-[30px] border border-white/10 bg-zinc-950/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            {locale === "en" ? "Daily path" : "Percorso daily"}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {locale === "en"
              ? "Keep the line alive."
              : "Tieni viva la serie."}
          </p>
        </div>

        <div className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
          7 days
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-[7%] right-[7%] top-[22px] h-px bg-zinc-800" />

        <div className="relative z-10 grid grid-cols-7 gap-1">
          {nodes.map((node, index) => {
            const active =
              node.completed || (node.isToday && node.isSelected && !node.completed)

            return (
              <div key={node.key} className="flex flex-col items-center">
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.28, delay: index * 0.035 }}
                  className="relative flex h-11 w-11 items-center justify-center"
                >
                  {index < nodes.length - 1 ? (
                    <div
                      className={`absolute left-1/2 top-1/2 h-px w-full -translate-y-1/2 ${
                        node.completed && nodes[index + 1]?.completed
                          ? "bg-green-400/70"
                          : node.completed
                            ? "bg-gradient-to-r from-green-400/70 to-zinc-800"
                            : "bg-zinc-800"
                      }`}
                    />
                  ) : null}

                  <motion.div
                    animate={
                      node.isSelected
                        ? {
                            boxShadow: [
                              "0 0 0 rgba(34,197,94,0)",
                              "0 0 22px rgba(34,197,94,0.28)",
                              "0 0 0 rgba(34,197,94,0)",
                            ],
                          }
                        : undefined
                    }
                    transition={{
                      duration: 2,
                      repeat: node.isSelected ? Infinity : 0,
                      ease: "easeInOut",
                    }}
                    className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                      node.completed
                        ? "border-green-300/70 bg-green-500 text-black"
                        : node.isToday
                          ? "border-amber-300/70 bg-amber-300 text-black"
                          : node.isFuture
                            ? "border-zinc-800 bg-zinc-950 text-zinc-600"
                            : "border-zinc-800 bg-zinc-950 text-zinc-500"
                    }`}
                  >
                    {node.completed ? "✓" : node.isToday ? "●" : "○"}
                  </motion.div>
                </motion.div>

                <p
                  className={`mt-2 max-w-[48px] truncate text-center text-[10px] font-medium uppercase tracking-[0.08em] ${
                    active
                      ? "text-green-300"
                      : node.isFuture
                        ? "text-zinc-600"
                        : "text-zinc-500"
                  }`}
                >
                  {node.label}
                </p>

                <p className="mt-0.5 text-[10px] text-zinc-600">
                  {node.sublabel}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}