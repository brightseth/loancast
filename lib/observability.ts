// Observability and error tracking with PostHog + Sentry

import { captureException, captureMessage, setTag, setContext } from '@sentry/nextjs'

// PostHog event types
export type LoanEvent = 
  | 'loan_created'
  | 'loan_funded' 
  | 'loan_due'
  | 'loan_overdue'
  | 'loan_defaulted'
  | 'loan_repaid'

export type RepaymentEvent =
  | 'repay_clicked'
  | 'repay_init'
  | 'repay_success'  
  | 'repay_fail'

export type UserEvent = 
  | 'user_signup'
  | 'profile_viewed'
  | 'notification_sent'

export type AllEvents = LoanEvent | RepaymentEvent | UserEvent

// Event properties interface
export interface EventProperties {
  loan_id?: string
  loan_number?: number
  borrower_fid?: number
  lender_fid?: number  
  amount_usdc?: string
  duration_days?: number
  cast_hash?: string
  tx_hash?: string
  error_code?: string
  error_message?: string
  [key: string]: any
}

// PostHog client (client-side only)
let posthog: any = null
if (typeof window !== 'undefined') {
  import('posthog-js').then(({ default: ph }) => {
    posthog = ph
  })
}

/** Track event to PostHog */
export function trackEvent(event: AllEvents, properties: EventProperties = {}) {
  try {
    // PostHog (client-side analytics)
    if (typeof window !== 'undefined' && posthog) {
      posthog.capture(event, {
        ...properties,
        timestamp: new Date().toISOString(),
        platform: 'loancast'
      })
    }
    
    // Server-side logging
    if (typeof window === 'undefined') {
      console.log(`📊 Event: ${event}`, properties)
    }
  } catch (error) {
    console.warn('Failed to track event:', error)
  }
}

/** Track loan lifecycle events */
export function trackLoan(event: LoanEvent, loanId: string, properties: EventProperties = {}) {
  trackEvent(event, {
    loan_id: loanId,
    ...properties
  })
}

/** Track repayment flow events */
export function trackRepayment(event: RepaymentEvent, loanId: string, properties: EventProperties = {}) {
  trackEvent(event, {
    loan_id: loanId, 
    flow: 'repayment',
    ...properties
  })
}

/** Enhanced error reporting with context */
export function reportError(error: Error, context: {
  loan_id?: string
  fid?: number
  cast_hash?: string
  tx_hash?: string
  endpoint?: string
  [key: string]: any
} = {}) {
  try {
    // Set Sentry tags and context
    if (context.loan_id) setTag('loan_id', context.loan_id)
    if (context.fid) setTag('fid', context.fid)  
    if (context.cast_hash) setTag('cast_hash', context.cast_hash)
    if (context.tx_hash) setTag('tx_hash', context.tx_hash)
    if (context.endpoint) setTag('endpoint', context.endpoint)
    
    setContext('loancast_context', context)
    
    // Capture to Sentry
    captureException(error)
    
    // Track error event
    trackEvent('repay_fail', {
      error_code: error.name,
      error_message: error.message,
      ...context
    })
    
  } catch (reportingError) {
    console.error('Failed to report error:', reportingError)
  }
}

/** Log info message with context */
export function logInfo(message: string, context: Record<string, any> = {}) {
  console.log(`ℹ️ ${message}`, context)
  
  if (typeof window === 'undefined') {
    captureMessage(message, 'info')
  }
}

/** Performance tracking for key operations */
export function timeOperation<T>(
  operationName: string, 
  operation: () => Promise<T>,
  context: Record<string, any> = {}
): Promise<T> {
  const startTime = Date.now()
  
  return operation()
    .then(result => {
      const duration = Date.now() - startTime
      
      trackEvent('repay_success', {
        operation: operationName,
        duration_ms: duration,
        ...context
      })
      
      if (duration > 5000) { // Log slow operations
        logInfo(`Slow operation: ${operationName} took ${duration}ms`, context)
      }
      
      return result
    })
    .catch(error => {
      const duration = Date.now() - startTime
      
      reportError(error, {
        operation: operationName,
        duration_ms: duration,
        ...context
      })
      
      throw error
    })
}

// Key metrics to track
export const METRICS = {
  // Loan metrics
  TIME_TO_FUND: 'time_to_fund_minutes',
  ONTIME_RATE: 'ontime_repayment_rate',
  DEFAULT_RATE: 'default_rate',
  REPEAT_BORROW_RATE: 'repeat_borrower_rate',
  
  // Engagement metrics  
  NUDGE_CONVERSION: 'nudge_to_repay_conversion',
  FRAME_CONVERSION: 'frame_to_loan_conversion',
  PROFILE_VIEWS: 'profile_page_views',
  
  // Technical metrics
  API_RESPONSE_TIME: 'api_response_time_ms',
  ERROR_RATE: 'error_rate_percent',
  WEBHOOK_SUCCESS_RATE: 'webhook_success_rate'
} as const

/** Helper to track conversion funnels */
export function trackFunnel(step: string, properties: EventProperties = {}) {
  trackEvent('repay_success', { // Generic success event
    funnel_step: step,
    ...properties
  })
}