import { track } from "@vercel/analytics"

type AnalyticsEventName =
  | "home_view"
  | "game_start"
  | "game_complete"
  | "challenge_created"
  | "challenge_status_opened"
  | "compare_view"
  | "locale_changed"
  | "mode_selected"
  | "daily_opened"
  | "daily_hub_view"
  | "daily_play_start"
  | "daily_completed"
  | "daily_shared"
  | "cta_click"
  | "nav_click"
  | "auth_click"
  | "consent_click"
  | "contact_click"
  | "ranked_opened"

type AnalyticsPayload = Record<
  string,
  string | number | boolean | null | undefined
>

export function trackEvent(
  event: AnalyticsEventName,
  payload: AnalyticsPayload = {}
) {
  if (typeof window === "undefined") return

  if (process.env.NODE_ENV === "development") {
    console.log("[analytics]", event, payload)
  }

  track(event, payload)
}