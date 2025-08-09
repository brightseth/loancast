import crypto from 'crypto'

export interface WebhookVerification {
  isValid: boolean
  error?: string
}

/**
 * Verify Neynar webhook HMAC signature
 * Based on: https://docs.neynar.com/docs/webhooks
 */
export function verifyNeynarWebhook(
  rawBody: string,
  signature: string,
  secret: string,
  tolerance: number = 600 // 10 minutes
): WebhookVerification {
  try {
    if (!signature || !signature.startsWith('sha256=')) {
      return { isValid: false, error: 'Missing or invalid signature format' }
    }

    // Extract the signature hash
    const providedSignature = signature.slice(7) // Remove 'sha256=' prefix
    
    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex')

    // Constant-time comparison to prevent timing attacks
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(providedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )

    if (!isSignatureValid) {
      return { isValid: false, error: 'Signature verification failed' }
    }

    return { isValid: true }

  } catch (error) {
    return { 
      isValid: false, 
      error: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

/**
 * Verify CRON_SECRET for cron job endpoints
 */
export function verifyCronSecret(
  authHeader: string | null,
  expectedSecret: string
): WebhookVerification {
  if (!authHeader) {
    return { isValid: false, error: 'Missing Authorization header' }
  }

  if (!authHeader.startsWith('Bearer ')) {
    return { isValid: false, error: 'Invalid Authorization header format' }
  }

  const providedSecret = authHeader.slice(7) // Remove 'Bearer ' prefix

  // Constant-time comparison
  if (providedSecret.length !== expectedSecret.length) {
    return { isValid: false, error: 'Invalid secret' }
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(providedSecret, 'utf8'),
    Buffer.from(expectedSecret, 'utf8')
  )

  if (!isValid) {
    return { isValid: false, error: 'Invalid secret' }
  }

  return { isValid: true }
}

/**
 * Middleware wrapper for webhook security
 */
export function withWebhookSecurity(
  handler: Function,
  options: {
    requireNeynarHMAC?: boolean
    requireCronSecret?: boolean
  }
) {
  return async (request: Request, ...args: any[]) => {
    // Verify Neynar HMAC if required
    if (options.requireNeynarHMAC) {
      const signature = request.headers.get('x-neynar-signature')
      const secret = process.env.NEYNAR_WEBHOOK_SECRET
      
      if (!secret) {
        return new Response(
          JSON.stringify({ error: 'Webhook secret not configured' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const rawBody = await request.text()
      const verification = verifyNeynarWebhook(rawBody, signature || '', secret)
      
      if (!verification.isValid) {
        return new Response(
          JSON.stringify({ error: verification.error }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Re-create request with consumed body
      request = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: rawBody
      })
    }

    // Verify CRON secret if required
    if (options.requireCronSecret) {
      const authHeader = request.headers.get('authorization')
      const secret = process.env.CRON_SECRET
      
      if (!secret) {
        return new Response(
          JSON.stringify({ error: 'CRON secret not configured' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const verification = verifyCronSecret(authHeader, secret)
      
      if (!verification.isValid) {
        return new Response(
          JSON.stringify({ error: verification.error }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    return handler(request, ...args)
  }
}