"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { useLocale } from "@/components/locale-provider"
import { useToast } from "@/components/toast-provider"

import { signInWithGoogle, signOut } from "@/lib/auth"
import { trackEvent } from "@/lib/analytics"
import { getMyProfile } from "@/lib/profile"
import {
  BADGE_DEFINITIONS,
  getLevelSnapshot,
  getMyJourney,
  type JourneyProgress,
  type UserBadge,
} from "@/lib/journey"

type GoogleFcWindow = Window & {
  googlefc?: {
    callbackQueue?: Array<() => void>
    showRevocationMessage?: () => void
  }
}

type SidebarLink = {
  href: string
  label: string
  icon: string
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const { user, loading } = useAuth()
  const { locale } = useLocale()
  const { showToast } = useToast()

  const [open, setOpen] = useState(false)
  const [consentReady, setConsentReady] = useState(false)
  const [accountLoading, setAccountLoading] = useState(false)
  const [profileNickname, setProfileNickname] = useState<string | null>(null)
  const [progress, setProgress] = useState<JourneyProgress | null>(null)
  const [badges, setBadges] = useState<UserBadge[]>([])

  const isEnglish = locale === "en"

  useEffect(() => {
    const checkConsentAvailability = () => {
      const googleWindow = window as GoogleFcWindow

      const callbackQueue = googleWindow.googlefc?.callbackQueue
      const showRevocationMessage = googleWindow.googlefc?.showRevocationMessage

      setConsentReady(
        typeof callbackQueue?.push === "function" &&
          typeof showRevocationMessage === "function"
      )
    }

    checkConsentAvailability()

    const interval = window.setInterval(checkConsentAvailability, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    let cancelled = false

    const loadAccountData = async () => {
      if (loading) return

      if (!user) {
        setProfileNickname(null)
        setProgress(null)
        setBadges([])
        return
      }

      try {
        setAccountLoading(true)

        const [profile, journey] = await Promise.all([
          getMyProfile(user.id),
          getMyJourney(user.id),
        ])

        if (cancelled) return

        setProfileNickname(profile?.nickname ?? null)
        setProgress(journey.progress)
        setBadges(journey.badges)
      } catch (error) {
        console.error("Errore caricamento dati sidebar:", error)

        if (!cancelled) {
          setProfileNickname(null)
          setProgress(null)
          setBadges([])
        }
      } finally {
        if (!cancelled) {
          setAccountLoading(false)
        }
      }
    }

    void loadAccountData()

    return () => {
      cancelled = true
    }
  }, [loading, user, pathname])

  const levelSnapshot = useMemo(() => {
    return getLevelSnapshot(progress?.xp ?? 0, locale)
  }, [progress?.xp, locale])

  const latestBadge = useMemo(() => {
    const badgeId = badges[0]?.badge_id

    if (!badgeId) return null

    return BADGE_DEFINITIONS.find((badge) => badge.id === badgeId) ?? null
  }, [badges])

  const displayName =
    profileNickname ??
    user?.email?.split("@")[0] ??
    (isEnglish ? "Player" : "Giocatore")

  const playLinks: SidebarLink[] = [
    {
      href: "/quick-play",
      label: isEnglish ? "Quick Play" : "Partita veloce",
      icon: "⚡",
    },
    {
      href: "/daily-word",
      label: "Daily Word",
      icon: "🌗",
    },
    {
      href: "/ranked-mode",
      label: "Ranked",
      icon: "🏁",
    },
  ]

  const directLinks: SidebarLink[] = [
    {
      href: "/journey",
      label: "Journey",
      icon: "🗺️",
    },
    {
      href: "/daily",
      label: "Daily Hub",
      icon: "🧭",
    },
    {
      href: "/ranked",
      label: isEnglish ? "Leaderboard" : "Classifica",
      icon: "🏆",
    },
  ]

  const infoLinks: SidebarLink[] = [
    {
      href: "/privacy",
      label: "Privacy",
      icon: "🛡️",
    },
  ]

  const handleLogin = async () => {
    try {
      trackEvent("auth_click", {
        source: "sidebar",
        action: "google_login",
        current_path: pathname || "/",
      })

      window.localStorage.setItem("linguo_after_login", pathname || "/")
      window.localStorage.setItem("linguo_after_profile", pathname || "/")

      await signInWithGoogle()
    } catch (error) {
      console.error("Errore login Google:", error)
    }
  }

  const handleLogout = async () => {
    try {
      trackEvent("auth_click", {
        source: "sidebar",
        action: "logout",
        current_path: pathname || "/",
      })

      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Errore logout:", error)
    }
  }

  const handleConsentClick = () => {
    trackEvent("consent_click", {
      source: "sidebar",
      available: consentReady,
    })

    const googleWindow = window as GoogleFcWindow

    const callbackQueue = googleWindow.googlefc?.callbackQueue
    const showRevocationMessage = googleWindow.googlefc?.showRevocationMessage

    if (
      typeof callbackQueue?.push === "function" &&
      typeof showRevocationMessage === "function"
    ) {
      callbackQueue.push(showRevocationMessage)
      return
    }

    showToast(
      isEnglish
        ? "Consent settings are not available yet."
        : "Le impostazioni del consenso non sono ancora disponibili.",
      "error"
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:border-green-500/30 hover:bg-zinc-950 md:hidden"
        style={{
          top: "max(1rem, env(safe-area-inset-top))",
        }}
        aria-label="Open navigation"
      >
        <span className="text-lg">☰</span>
      </button>

      <aside className="fixed left-4 top-1/2 z-[60] hidden w-[238px] -translate-y-1/2 md:block">
        <SidebarContent
          pathname={pathname}
          loading={loading}
          accountLoading={accountLoading}
          userEmail={user?.email ?? null}
          displayName={displayName}
          level={levelSnapshot.level}
          levelTitle={levelSnapshot.title}
          xp={levelSnapshot.xp}
          xpIntoLevel={levelSnapshot.xpIntoLevel}
          nextLevelXp={levelSnapshot.nextLevelXp}
          xpToNextLevel={levelSnapshot.xpToNextLevel}
          progressPercent={levelSnapshot.progressPercent}
          badgeIcon={latestBadge?.icon ?? null}
          badgeTitle={latestBadge?.title[locale] ?? null}
          playLinks={playLinks}
          directLinks={directLinks}
          infoLinks={infoLinks}
          consentReady={consentReady}
          isEnglish={isEnglish}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onConsentClick={handleConsentClick}
        />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-[80] md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div
            className="absolute left-4 right-4"
            style={{
              top: "max(1rem, env(safe-area-inset-top))",
            }}
          >
            <SidebarContent
              pathname={pathname}
              loading={loading}
              accountLoading={accountLoading}
              userEmail={user?.email ?? null}
              displayName={displayName}
              level={levelSnapshot.level}
              levelTitle={levelSnapshot.title}
              xp={levelSnapshot.xp}
              xpIntoLevel={levelSnapshot.xpIntoLevel}
              nextLevelXp={levelSnapshot.nextLevelXp}
              xpToNextLevel={levelSnapshot.xpToNextLevel}
              progressPercent={levelSnapshot.progressPercent}
              badgeIcon={latestBadge?.icon ?? null}
              badgeTitle={latestBadge?.title[locale] ?? null}
              playLinks={playLinks}
              directLinks={directLinks}
              infoLinks={infoLinks}
              consentReady={consentReady}
              isEnglish={isEnglish}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onConsentClick={handleConsentClick}
              onClose={() => setOpen(false)}
              mobile
            />
          </div>
        </div>
      ) : null}
    </>
  )
}

function SidebarContent({
  pathname,
  loading,
  accountLoading,
  userEmail,
  displayName,
  level,
  levelTitle,
  xp,
  xpIntoLevel,
  nextLevelXp,
  xpToNextLevel,
  progressPercent,
  badgeIcon,
  badgeTitle,
  playLinks,
  directLinks,
  infoLinks,
  consentReady,
  isEnglish,
  onLogin,
  onLogout,
  onConsentClick,
  onClose,
  mobile = false,
}: {
  pathname: string | null
  loading: boolean
  accountLoading: boolean
  userEmail: string | null
  displayName: string
  level: number
  levelTitle: string
  xp: number
  xpIntoLevel: number
  nextLevelXp: number
  xpToNextLevel: number
  progressPercent: number
  badgeIcon: string | null
  badgeTitle: string | null
  playLinks: SidebarLink[]
  directLinks: SidebarLink[]
  infoLinks: SidebarLink[]
  consentReady: boolean
  isEnglish: boolean
  onLogin: () => void
  onLogout: () => void
  onConsentClick: () => void
  onClose?: () => void
  mobile?: boolean
}) {
  return (
    <nav className="relative max-h-[calc(100svh-2rem)] overflow-y-auto rounded-[30px] border border-white/10 bg-black/55 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,197,94,0.13),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent)]" />

      <div className="relative space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            onClick={() =>
              trackEvent("nav_click", {
                source: "sidebar",
                label: "Linguo",
                target: "/",
              })
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-lg font-semibold text-green-300">
              L
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Linguo</p>
              <p className="text-[11px] text-zinc-500">
                {isEnglish ? "Language game" : "Gioco linguistico"}
              </p>
            </div>
          </Link>

          {mobile ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-zinc-950/70 text-zinc-300"
              aria-label="Close navigation"
            >
              ×
            </button>
          ) : null}
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-600">
            Account
          </p>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-zinc-500">
              {isEnglish ? "Checking session..." : "Controllo sessione..."}
            </div>
          ) : userEmail ? (
            <div className="space-y-3">
              <div className="rounded-3xl border border-green-500/20 bg-green-500/[0.08] p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-xl">
                    {badgeIcon ?? "👤"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {displayName}
                    </p>

                    <p className="mt-1 text-xs text-green-300">
                      Lv. {level} · {levelTitle}
                    </p>

                    <p className="mt-1 truncate text-[11px] text-zinc-500">
                      {badgeTitle
                        ? `Badge: ${badgeTitle}`
                        : isEnglish
                          ? "No badge unlocked yet"
                          : "Nessun badge sbloccato"}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
                    <span>
                      {accountLoading ? "..." : `${xpIntoLevel}/${nextLevelXp} XP`}
                    </span>

                    <span>
                      {accountLoading ? "..." : `-${xpToNextLevel} XP`}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-300 transition-all duration-500"
                      style={{
                        width: `${progressPercent}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Link
                    href="/profile"
                    onClick={() =>
                      trackEvent("nav_click", {
                        source: "sidebar",
                        label: isEnglish ? "Profile" : "Profilo",
                        target: "/profile",
                      })
                    }
                    className="flex h-9 flex-1 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-xs font-medium text-zinc-300 transition hover:border-green-500/25 hover:text-green-300"
                  >
                    {isEnglish ? "Profile" : "Profilo"}
                  </Link>

                  <Link
                    href="/journey"
                    onClick={() =>
                      trackEvent("nav_click", {
                        source: "sidebar",
                        label: "Journey",
                        target: "/journey",
                      })
                    }
                    className="flex h-9 flex-1 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-xs font-medium text-green-300 transition hover:bg-green-500/15"
                  >
                    Journey
                  </Link>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950/70 px-3 py-2">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-600">
                    XP
                  </span>

                  <span className="text-xs font-semibold text-green-300">
                    {accountLoading ? "..." : xp}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-left text-sm text-zinc-400 transition hover:border-red-500/25 hover:text-red-300"
              >
                <span>↩</span>
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className="flex w-full items-center gap-3 rounded-2xl border border-green-500/25 bg-green-500/10 px-3 py-3 text-left text-sm font-medium text-green-300 transition hover:bg-green-500/15"
            >
              <span>🔐</span>
              <span>{isEnglish ? "Sign in" : "Accedi"}</span>
            </button>
          )}
        </div>

        <SidebarGroup
          title={isEnglish ? "How to play" : "Come giocare"}
          links={playLinks}
          pathname={pathname}
        />

        <SidebarGroup
          title={isEnglish ? "Play" : "Gioca"}
          links={directLinks}
          pathname={pathname}
        />

        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-600">
            {isEnglish ? "Information" : "Informazioni"}
          </p>

          <div className="space-y-2">
            {infoLinks.map((link) => (
              <SidebarNavLink key={link.href} link={link} pathname={pathname} />
            ))}

            <button
              type="button"
              onClick={onConsentClick}
              className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition ${
                consentReady
                  ? "border-white/10 bg-black/30 text-zinc-400 hover:border-green-500/25 hover:text-green-300"
                  : "border-white/5 bg-black/20 text-zinc-700"
              }`}
            >
              <span>⚙️</span>
              <span>
                {isEnglish ? "Manage consent" : "Gestisci consenso"}
              </span>
            </button>

            <a
              href="mailto:contact@noyrex.com"
              onClick={() =>
                trackEvent("contact_click", {
                  source: "sidebar",
                  target: "contact@noyrex.com",
                })
              }
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-zinc-400 transition hover:border-green-500/25 hover:text-green-300"
            >
              <span>✉️</span>
              <span className="truncate">contact@noyrex.com</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}

function SidebarGroup({
  title,
  links,
  pathname,
}: {
  title: string
  links: SidebarLink[]
  pathname: string | null
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-3">
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-600">
        {title}
      </p>

      <div className="space-y-2">
        {links.map((link) => (
          <SidebarNavLink key={link.href} link={link} pathname={pathname} />
        ))}
      </div>
    </div>
  )
}

function SidebarNavLink({
  link,
  pathname,
}: {
  link: SidebarLink
  pathname: string | null
}) {
  const active = pathname === link.href

  return (
    <Link
      href={link.href}
      onClick={() =>
        trackEvent("nav_click", {
          source: "sidebar",
          label: link.label,
          target: link.href,
        })
      }
      className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition ${
        active
          ? "border-green-500/30 bg-green-500/10 text-green-300"
          : "border-white/10 bg-black/30 text-zinc-400 hover:border-green-500/25 hover:text-green-300"
      }`}
    >
      <span>{link.icon}</span>
      <span className="truncate">{link.label}</span>
    </Link>
  )
}