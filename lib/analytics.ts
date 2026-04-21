type AnalyticsEventName =
  | "home_view"
  | "game_start"
  | "game_complete"
  | "challenge_created"
  | "challenge_status_opened"
  | "compare_view"
  | "locale_changed"
  | "mode_selected"

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

export function trackEvent(
  event: AnalyticsEventName,
  payload: AnalyticsPayload = {}
) {
  if (typeof window === "undefined") return

  // Per ora debug leggero in dev.
  if (process.env.NODE_ENV === "development") {
    console.log("[analytics]", event, payload)
  }

  // Placeholder pronto per strumenti futuri:
  // - Vercel custom events su Pro/Enterprise
  // - GA4
  // - PostHog
}