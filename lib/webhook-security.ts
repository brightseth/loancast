/**
 * Production-ready webhook security utilities
 * Based on security feedback for launch readiness
 */
import crypto from 'crypto'

/**
 * Verify Neynar webhook with timing-safe comparison and timestamp validation
 */
export function verifyNeynarWebhookSecure(
  rawBody: string,
  signature: string,
  secret: string,
  maxSkewMinutes = 5
): { valid: boolean; error?: string } {
  if (!secret) {
    return { valid: false, error: 'Webhook secret not configured' }
  }

  if (!signature) {
    return { valid: false, error: 'Missing signature header' }
  }

  // Remove 'sha256=' prefix if present
  const cleanSignature = signature.replace(/^sha256=/, '')

  // Calculate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex')

  // Timing-safe comparison
  const signatureValid = crypto.timingSafeEqual(
    Buffer.from(cleanSignature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )

  if (!signatureValid) {
    return { valid: false, error: 'Invalid signature' }
  }

  // Parse payload to check timestamp (if available)
  try {
    const payload = JSON.parse(rawBody)
    if (payload.created_at) {
      const eventTime = new Date(payload.created_at)
      const now = new Date()
      const skewMs = Math.abs(now.getTime() - eventTime.getTime())
      const maxSkewMs = maxSkewMinutes * 60 * 1000

      if (skewMs > maxSkewMs) {
        return { 
          valid: false, 
          error: `Timestamp skew too large: ${Math.round(skewMs / 1000)}s` 
        }
      }
    }
  } catch (e) {
    // If we can't parse timestamp, proceed with signature validation only
    console.warn('Could not parse webhook timestamp for skew check:', e)
  }

  return { valid: true }
}

/**
 * Check webhook rate limits per FID and event type
 */
export async function checkWebhookRateLimit(
  supabase: any,
  fid: number,
  eventType: string,
  maxPerMinute: number = 30
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date()
  windowStart.setSeconds(0, 0) // Round to minute boundary

  // Get or create rate limit entry
  const { data: existing } = await supabase
    .from('webhook_rate_limits')
    .select('count')
    .eq('fid', fid)
    .eq('event_type', eventType)
    .eq('window_start', windowStart.toISOString())
    .single()

  if (existing) {
    if (existing.count >= maxPerMinute) {
      return { allowed: false, remaining: 0 }
    }

    // Increment counter
    await supabase
      .from('webhook_rate_limits')
      .update({ count: existing.count + 1 })
      .eq('fid', fid)
      .eq('event_type', eventType)
      .eq('window_start', windowStart.toISOString())

    return { allowed: true, remaining: maxPerMinute - existing.count - 1 }
  } else {
    // Create new entry
    await supabase
      .from('webhook_rate_limits')
      .insert({
        fid,
        event_type: eventType,
        count: 1,
        window_start: windowStart.toISOString()
      })

    return { allowed: true, remaining: maxPerMinute - 1 }
  }
}

/**
 * Detect obviously malicious patterns in webhook events
 */
export function detectAbusePattern(events: Array<{
  fid: number
  type: string
  text?: string
  timestamp: string
}>): { suspicious: boolean; reason?: string } {
  // Same FID posting many $ amounts in short window
  const recentEvents = events.filter(e => {
    const eventTime = new Date(e.timestamp)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return eventTime > fiveMinutesAgo
  })

  const fidGroups = recentEvents.reduce((acc, event) => {
    if (!acc[event.fid]) acc[event.fid] = []
    acc[event.fid].push(event)
    return acc
  }, {} as Record<number, typeof events>)

  for (const [fid, fidEvents] of Object.entries(fidGroups)) {
    // Check for spam patterns
    const dollarAmountCount = fidEvents.filter(e => 
      e.text && /\$\d+/.test(e.text)
    ).length

    if (dollarAmountCount > 10) {
      return { 
        suspicious: true, 
        reason: `FID ${fid} posted ${dollarAmountCount} dollar amounts in 5min` 
      }
    }

    // Check for rapid-fire identical messages
    const textCounts = fidEvents.reduce((acc, e) => {
      if (e.text) {
        acc[e.text] = (acc[e.text] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const maxRepeats = Math.max(...Object.values(textCounts))
    if (maxRepeats > 5) {
      return { 
        suspicious: true, 
        reason: `FID ${fid} posted identical message ${maxRepeats} times` 
      }
    }
  }

  return { suspicious: false }
}

/**
 * Parse potential bid amount from reply text
 * Returns null for ambiguous/suspicious cases
 */
export function parseBidAmount(text: string): number | null {
  // Clean up text
  const cleanText = text.toLowerCase().trim()

  // Look for clear dollar amounts
  const dollarMatch = cleanText.match(/^\$?(\d+(?:,\d+)*(?:\.\d{1,2})?)\s*(?:usdc)?$/i)
  if (dollarMatch) {
    const amount = parseFloat(dollarMatch[1].replace(/,/g, ''))
    // Reasonable bounds check
    if (amount >= 1 && amount <= 100000) {
      return amount
    }
  }

  // Look for "X USDC" format
  const usdcMatch = cleanText.match(/^(\d+(?:,\d+)*(?:\.\d{1,2})?)\s+usdc$/i)
  if (usdcMatch) {
    const amount = parseFloat(usdcMatch[1].replace(/,/g, ''))
    if (amount >= 1 && amount <= 100000) {
      return amount
    }
  }

  // Reject ambiguous cases:
  // - Multiple amounts: "$100 + $5 tip"
  // - Mixed currency: "$100 ETH"  
  // - Non-monetary: "I'm $100% sure"
  const multipleAmounts = (cleanText.match(/\$?\d+/g) || []).length > 1
  const hasNonUSDC = /eth|btc|sol|matic/i.test(cleanText)
  const hasExtraWords = cleanText.split(/\s+/).length > 3

  if (multipleAmounts || hasNonUSDC || hasExtraWords) {
    return null
  }

  return null
}

/**
 * Record audit event for loan state changes
 */
export async function recordLoanEvent(
  supabase: any,
  loanId: string,
  kind: string,
  meta: Record<string, any> = {}
): Promise<void> {
  await supabase
    .from('loan_events')
    .insert({
      loan_id: loanId,
      kind,
      meta,
      created_at: new Date().toISOString()
    })
}