/**
 * Feature flags for launch safety
 */

// Environment variable feature flags
export const featureFlags = {
  // Kill switch: set LOANS_DISABLED=true to pause new loan creation
  loansEnabled: process.env.LOANS_DISABLED !== 'true',
  
  // Allow disabling specific features
  lendingEnabled: process.env.LENDING_DISABLED !== 'true',
  repaymentsEnabled: process.env.REPAYMENTS_DISABLED !== 'true',
  notificationsEnabled: process.env.NOTIFICATIONS_DISABLED !== 'true',
  
  // Launch flag for test endpoints
  isProduction: process.env.LAUNCH === 'true' || process.env.NODE_ENV === 'production'
}

/**
 * Check if new loan creation is allowed
 */
export function canCreateLoans(): { allowed: boolean; reason?: string } {
  if (!featureFlags.loansEnabled) {
    return {
      allowed: false,
      reason: 'Loan creation is temporarily disabled for maintenance. Existing loans can still be repaid.'
    }
  }
  return { allowed: true }
}

/**
 * Check if lending/funding is allowed  
 */
export function canFundLoans(): { allowed: boolean; reason?: string } {
  if (!featureFlags.lendingEnabled) {
    return {
      allowed: false,
      reason: 'Loan funding is temporarily disabled for maintenance.'
    }
  }
  return { allowed: true }
}

/**
 * Check if repayments are allowed (should almost always be true)
 */
export function canRepayLoans(): { allowed: boolean; reason?: string } {
  if (!featureFlags.repaymentsEnabled) {
    return {
      allowed: false,
      reason: 'Repayments are temporarily disabled for emergency maintenance.'
    }
  }
  return { allowed: true }
}