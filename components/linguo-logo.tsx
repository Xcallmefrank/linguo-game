type LinguoLogoProps = {
  className?: string
}

export function LinguoLogo({ className }: LinguoLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="linguo-green" x1="12" y1="10" x2="54" y2="54">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>

      <circle
        cx="32"
        cy="32"
        r="22"
        fill="rgba(255,255,255,0.03)"
        stroke="rgba(156,163,175,0.5)"
        strokeWidth="2"
      />

      <path
        d="M22 26C24.5 22.5 28.2 20.5 32.5 20.5C38.5 20.5 43.5 24.5 45.2 30"
        stroke="url(#linguo-green)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      <path
        d="M42 38C39.5 41.5 35.8 43.5 31.5 43.5C25.5 43.5 20.5 39.5 18.8 34"
        stroke="url(#linguo-green)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      <path
        d="M32 18V46"
        stroke="rgba(229,231,235,0.85)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      <path
        d="M21 24C25 27 39 27 43 24"
        stroke="rgba(229,231,235,0.55)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M21 40C25 37 39 37 43 40"
        stroke="rgba(229,231,235,0.55)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <circle cx="32" cy="32" r="3.5" fill="#4ade80" />
    </svg>
  )
}