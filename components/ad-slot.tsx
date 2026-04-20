type AdSlotProps = {
  label?: string
  tall?: boolean
}

export function AdSlot({
  label = "Spazio pubblicitario",
  tall = false,
}: AdSlotProps) {
  return (
    <div
      className={`flex w-full items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/60 px-4 text-sm text-zinc-500 ${
        tall ? "min-h-36 py-10" : "min-h-24 py-6"
      }`}
    >
      {label}
    </div>
  )
}