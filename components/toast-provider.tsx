"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import { AnimatePresence, motion } from "motion/react"

type ToastType = "success" | "error" | "info"

type ToastItem = {
  id: number
  title: string
  type: ToastType
}

type ToastContextValue = {
  showToast: (title: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((title: string, type: ToastType = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000)

    setToasts((prev) => [...prev, { id, title, type }])

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 2800)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
        <div className="flex w-full max-w-md flex-col gap-3">
          <AnimatePresence>
            {toasts.map((toast) => {
              const tone =
                toast.type === "success"
                  ? "border-green-500/30 bg-green-500/10 text-green-300"
                  : toast.type === "error"
                  ? "border-red-500/30 bg-red-500/10 text-red-300"
                  : "border-white/10 bg-black/70 text-white"

              return (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: -14, scale: 0.98, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, scale: 0.98, filter: "blur(6px)" }}
                  transition={{ duration: 0.24 }}
                  className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${tone}`}
                >
                  <p className="text-sm font-medium">{toast.title}</p>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider")
  }

  return context
}