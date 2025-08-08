import { NextRequest, NextResponse } from 'next/server'
import { guardTestEndpoint } from '@/lib/launch-guard'

export async function POST(request: NextRequest) {
  // Guard test endpoint in production
  const guard = guardTestEndpoint()
  if (guard) return guard
  try {
    // Simulate a cast.deleted webhook payload
    const testPayload = {
      type: 'cast.deleted',
      data: {
        hash: '0x0000000000000000000000000000000000000000', // Test hash
        cast_hash: '0x0000000000000000000000000000000000000000',
        author: {
          fid: 123,
          display_name: 'Test User'
        },
        timestamp: new Date().toISOString()
      }
    }

    console.log('Testing webhook with payload:', testPayload)

    // Call the webhook handler
    const webhookResponse = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://loancast.app'}/api/webhooks/neynar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    })

    const webhookResult = await webhookResponse.json()

    return NextResponse.json({
      success: true,
      test_payload: testPayload,
      webhook_response: {
        status: webhookResponse.status,
        result: webhookResult
      },
      message: 'Webhook test completed'
    })

  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json(
      { error: 'Webhook test failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    info: 'Webhook testing endpoint',
    usage: {
      'POST /api/test-webhook': 'Test the cast deletion webhook functionality',
      'webhook_url': '/api/webhooks/neynar',
      'supported_events': [
        'cast.created - Track replies to loan casts',
        'reaction.created - Track likes/recasts on loans', 
        'cast.deleted - Auto-delete loans when casts are removed'
      ]
    },
    setup_instructions: {
      neynar_webhook_config: {
        url: 'https://loancast.app/api/webhooks/neynar',
        events: ['cast.created', 'reaction.created', 'cast.deleted'],
        secret: 'Configure NEYNAR_WEBHOOK_SECRET environment variable'
      }
    }
  })
}