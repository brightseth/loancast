import posthog from 'posthog-js'

export class Analytics {
  private static instance: Analytics | null = null
  private initialized = false

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics()
    }
    return Analytics.instance
  }

  init() {
    if (this.initialized || typeof window === 'undefined') return

    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com'

    if (!apiKey) {
      console.warn('PostHog API key not found. Analytics will not be tracked.')
      return
    }

    posthog.init(apiKey, {
      api_host: apiHost,
      person_profiles: 'identified_only',
      capture_pageview: false, // We'll handle page views manually
      capture_pageleave: true,
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          posthog.debug()
        }
      },
    })

    this.initialized = true
  }

  // Page tracking
  pageView(path?: string) {
    if (!this.initialized) return
    posthog.capture('$pageview', {
      path: path || window.location.pathname
    })
  }

  // User identification
  identify(userId: string, properties?: Record<string, any>) {
    if (!this.initialized) return
    posthog.identify(userId, properties)
  }

  // Custom event tracking
  track(event: string, properties?: Record<string, any>) {
    if (!this.initialized) return
    posthog.capture(event, properties)
  }

  // Loan-specific events
  loanCreated(loanData: {
    loanId: string
    amount: number
    duration: number
    apr: number
    borrowerFid: string
  }) {
    this.track('Loan Created', {
      loan_id: loanData.loanId,
      amount: loanData.amount,
      duration_months: loanData.duration,
      apr: loanData.apr,
      borrower_fid: loanData.borrowerFid,
      loan_size_bucket: this.getLoanSizeBucket(loanData.amount),
    })
  }

  loanFunded(loanData: {
    loanId: string
    amount: number
    lenderFid: string
    borrowerFid: string
  }) {
    this.track('Loan Funded', {
      loan_id: loanData.loanId,
      amount: loanData.amount,
      lender_fid: loanData.lenderFid,
      borrower_fid: loanData.borrowerFid,
      loan_size_bucket: this.getLoanSizeBucket(loanData.amount),
    })
  }

  loanRepaid(loanData: {
    loanId: string
    amount: number
    daysToRepay: number
    onTime: boolean
  }) {
    this.track('Loan Repaid', {
      loan_id: loanData.loanId,
      amount: loanData.amount,
      days_to_repay: loanData.daysToRepay,
      on_time: loanData.onTime,
      loan_size_bucket: this.getLoanSizeBucket(loanData.amount),
    })
  }

  // Search and discovery events
  searchPerformed(query: string, filters: Record<string, any>, resultsCount: number) {
    this.track('Search Performed', {
      query,
      filters,
      results_count: resultsCount,
      has_filters: Object.keys(filters).length > 0,
    })
  }

  profileViewed(profileData: {
    fid: string
    viewerFid?: string
    totalLoans: number
    creditScore: number
  }) {
    this.track('Profile Viewed', {
      profile_fid: profileData.fid,
      viewer_fid: profileData.viewerFid,
      total_loans: profileData.totalLoans,
      credit_score: profileData.creditScore,
      credit_tier: this.getCreditTier(profileData.creditScore),
    })
  }

  // User engagement events
  buttonClicked(buttonName: string, context?: string) {
    this.track('Button Clicked', {
      button_name: buttonName,
      context,
      page: window.location.pathname,
    })
  }

  formStarted(formName: string) {
    this.track('Form Started', {
      form_name: formName,
      page: window.location.pathname,
    })
  }

  formCompleted(formName: string, completionTime?: number) {
    this.track('Form Completed', {
      form_name: formName,
      completion_time_seconds: completionTime,
      page: window.location.pathname,
    })
  }

  formAbandoned(formName: string, abandonedField?: string) {
    this.track('Form Abandoned', {
      form_name: formName,
      abandoned_at_field: abandonedField,
      page: window.location.pathname,
    })
  }

  // Error tracking
  errorOccurred(error: {
    message: string
    page: string
    userAgent?: string
    userId?: string
  }) {
    this.track('Error Occurred', {
      error_message: error.message,
      page: error.page,
      user_agent: error.userAgent || navigator.userAgent,
      user_id: error.userId,
    })
  }

  // Feature usage
  featureUsed(featureName: string, properties?: Record<string, any>) {
    this.track('Feature Used', {
      feature_name: featureName,
      ...properties,
      page: window.location.pathname,
    })
  }

  // Helper functions
  private getLoanSizeBucket(amount: number): string {
    if (amount < 100) return '< $100'
    if (amount < 500) return '$100-$500'
    if (amount < 1000) return '$500-$1000'
    if (amount < 2000) return '$1000-$2000'
    return '$2000+'
  }

  private getCreditTier(score: number): string {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Building'
  }

  // Conversion funnel tracking
  funnelStep(funnelName: string, step: string, properties?: Record<string, any>) {
    this.track(`${funnelName} - ${step}`, {
      funnel_name: funnelName,
      step,
      ...properties,
    })
  }

  // Performance tracking
  performanceMetric(metricName: string, value: number, unit: string = 'ms') {
    this.track('Performance Metric', {
      metric_name: metricName,
      value,
      unit,
      page: window.location.pathname,
    })
  }

  // A/B testing support
  experimentViewed(experimentName: string, variant: string) {
    this.track('Experiment Viewed', {
      experiment_name: experimentName,
      variant,
      page: window.location.pathname,
    })
  }
}

// Export singleton instance
export const analytics = Analytics.getInstance()

// React hook for analytics
export function useAnalytics() {
  return analytics
}