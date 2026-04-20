"use client"

import { motion } from "motion/react"
import { useMemo } from "react"

const glyphs = [
  "あ", "い", "う", "え", "お",
  "ア", "カ", "サ", "タ", "ナ",
  "한", "글", "가", "나", "다",
  "Ж", "Д", "Я", "Ф", "Б",
  "ع", "ل", "م", "ن", "ر",
  "字", "語", "文",
]

export function FloatingGlyphs() {
  const items = useMemo(() => {
    return Array.from({ length: 32 }).map((_, i) => ({
      id: i,
      glyph: glyphs[i % glyphs.length],
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: 7 + Math.random() * 7,
      delay: Math.random() * 5,
      size: 22 + Math.random() * 30,
      colorType: Math.random() > 0.5 ? "green" : "dark",
      rotate: -8 + Math.random() * 16,
    }))
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((item) => {
        const isGreen = item.colorType === "green"

        return (
          <motion.span
            key={item.id}
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{
              opacity: [0, 0.32, 0],
              y: [16, -6, -24],
              scale: [0.92, 1, 1.04],
            }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute select-none font-semibold"
            style={{
              top: item.top,
              left: item.left,
              fontSize: `${item.size}px`,
              transform: `rotate(${item.rotate}deg)`,
              color: isGreen ? "#22c55e" : "#0a0a0a",
              WebkitTextStroke: "1px rgba(156, 163, 175, 0.55)",
              textShadow: isGreen
                ? "0 0 12px rgba(34, 197, 94, 0.18)"
                : "0 0 8px rgba(255, 255, 255, 0.05)",
            }}
          >
            {item.glyph}
          </motion.span>
        )
      })}
    </div>
  )
}