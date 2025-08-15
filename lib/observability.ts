// Observability and logging utilities for LoanCast

export type ObservabilityEvent = 
  | 'HUMAN_AUTOFUND_ACCEPTED'
  | 'HUMAN_AUTOFUND_REJECTED'
  | 'AGENT_AUTOFUND_ACCEPTED'
  | 'AGENT_AUTOFUND_REJECTED'
  | 'MANUAL_FUND_COMPLETED'
  | 'LOAN_CREATED'
  | 'LOAN_REPAID'
  | 'POLICY_EVALUATION'

export interface EventData {
  event: ObservabilityEvent
  loan_id?: string
  lender_fid?: number
  lender_type?: 'human' | 'agent'
  borrower_fid?: number
  borrower_type?: 'human' | 'agent'
  amount_usdc_6?: string  // BigInt as string
  reasons?: string[]
  metadata?: Record<string, any>
  timestamp: string
}

class ObservabilityLogger {
  private isEnabled: boolean

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' || process.env.OBSERVABILITY_ENABLED === 'true'
  }

  async logEvent(data: Omit<EventData, 'timestamp'>): Promise<void> {
    const eventData: EventData = {
      ...data,
      timestamp: new Date().toISOString()
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Observability Event:', JSON.stringify(eventData, null, 2))
    }

    // In production, you might want to send to external services like:
    // - DataDog
    // - PostHog
    // - Custom analytics endpoint
    // - Supabase analytics table
    
    if (this.isEnabled) {
      try {
        // Store events in database for analysis
        await this.storeEvent(eventData)
        
        // Send to external analytics if configured
        await this.sendToExternalAnalytics(eventData)
      } catch (error) {
        console.error('Failed to log observability event:', error)
        // Don't throw - observability failures shouldn't break core functionality
      }
    }
  }

  private async storeEvent(data: EventData): Promise<void> {
    // TODO: Store in a dedicated observability/analytics table
    // For now, just console log in production
    if (process.env.NODE_ENV === 'production') {
      console.log('Analytics Event:', JSON.stringify(data))
    }
  }

  private async sendToExternalAnalytics(data: EventData): Promise<void> {
    // TODO: Send to external analytics services if configured
    // Examples:
    // - PostHog: await posthog.capture(data.event, data)
    // - DataDog: await datadog.increment(data.event, 1, data)
    // - Custom webhook: await fetch(process.env.ANALYTICS_WEBHOOK_URL, ...)
  }

  // Convenience methods for specific events
  async logHumanAutofundAccepted(loanId: string, lenderFid: number, borrowerFid: number, borrowerType: 'human' | 'agent', amountUsdc6: bigint): Promise<void> {
    await this.logEvent({
      event: 'HUMAN_AUTOFUND_ACCEPTED',
      loan_id: loanId,
      lender_fid: lenderFid,
      lender_type: 'human',
      borrower_fid: borrowerFid,
      borrower_type: borrowerType,
      amount_usdc_6: amountUsdc6.toString()
    })
  }

  async logHumanAutofundRejected(loanId: string, lenderFid: number, borrowerFid: number, borrowerType: 'human' | 'agent', reasons: string[]): Promise<void> {
    await this.logEvent({
      event: 'HUMAN_AUTOFUND_REJECTED',
      loan_id: loanId,
      lender_fid: lenderFid,
      lender_type: 'human',
      borrower_fid: borrowerFid,
      borrower_type: borrowerType,
      reasons
    })
  }

  async logAgentAutofundAccepted(loanId: string, agentFid: number, borrowerFid: number, borrowerType: 'human' | 'agent', amountUsdc6: bigint): Promise<void> {
    await this.logEvent({
      event: 'AGENT_AUTOFUND_ACCEPTED',
      loan_id: loanId,
      lender_fid: agentFid,
      lender_type: 'agent',
      borrower_fid: borrowerFid,
      borrower_type: borrowerType,
      amount_usdc_6: amountUsdc6.toString()
    })
  }

  async logAgentAutofundRejected(loanId: string, agentFid: number, borrowerFid: number, borrowerType: 'human' | 'agent', reasons: string[]): Promise<void> {
    await this.logEvent({
      event: 'AGENT_AUTOFUND_REJECTED',
      loan_id: loanId,
      lender_fid: agentFid,
      lender_type: 'agent',
      borrower_fid: borrowerFid,
      borrower_type: borrowerType,
      reasons
    })
  }

  async logManualFundCompleted(loanId: string, lenderFid: number, borrowerFid: number, amountUsdc6: bigint): Promise<void> {
    await this.logEvent({
      event: 'MANUAL_FUND_COMPLETED',
      loan_id: loanId,
      lender_fid: lenderFid,
      lender_type: 'human', // Manual funding is always human for now
      borrower_fid: borrowerFid,
      amount_usdc_6: amountUsdc6.toString()
    })
  }

  async logPolicyEvaluation(loanId: string, lenderFid: number, lenderType: 'human' | 'agent', decision: boolean, reasons: string[], metadata?: Record<string, any>): Promise<void> {
    await this.logEvent({
      event: 'POLICY_EVALUATION',
      loan_id: loanId,
      lender_fid: lenderFid,
      lender_type: lenderType,
      reasons,
      metadata: {
        ...metadata,
        decision
      }
    })
  }
}

// Singleton instance
export const observability = new ObservabilityLogger()

// Helper function for structured logging
export function logInfo(message: string, data?: Record<string, any>): void {
  console.log(`ℹ️ ${message}`, data ? JSON.stringify(data, null, 2) : '')
}

export function logWarning(message: string, data?: Record<string, any>): void {
  console.warn(`⚠️ ${message}`, data ? JSON.stringify(data, null, 2) : '')
}

export function logError(message: string, error?: Error | any, data?: Record<string, any>): void {
  console.error(`❌ ${message}`, error?.message || error, data ? JSON.stringify(data, null, 2) : '')
}