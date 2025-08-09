/**
 * Feature flags for MVP
 * Set to false to disable features and reduce surface area
 */
export const FLAGS = {
  // Core features (keep ON for MVP)
  BORROW_FLOW: true,
  REPAY_FLOW: true,
  EXPLORE_PAGE: true,
  
  // Features to disable for MVP
  IDENTITY_CAP_BOOSTS: false,
  ADMIN_DASHBOARD: false,
  AUTO_REFINANCE: false,
  LEADERBOARD: false,
  BADGES_VISUALS: false,
  DB_RATE_LIMITS: false,        // use in-memory fallback
  NOTIFICATIONS: false,
  LENDING_DASHBOARD: true,       // re-enabled by user request
  CRON_JOBS: false,             // disable for now
  ANALYTICS: false,
  FEEDBACK: false,
} as const

export function isEnabled(flag: keyof typeof FLAGS): boolean {
  return FLAGS[flag]
}