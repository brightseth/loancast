import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Miniapp webhook received:', body)

    switch (body.type) {
      case 'miniapp_added':
        // User added the miniapp
        await handleMiniAppAdded(body.data)
        break
        
      case 'miniapp_removed':
        // User removed the miniapp
        await handleMiniAppRemoved(body.data)
        break
        
      default:
        console.log('Unknown webhook type:', body.type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleMiniAppAdded(data: any) {
  // Track miniapp installation
  console.log('User added miniapp:', data.fid)
  
  // Could store in database, send welcome notification, etc.
  // For now, just log it
}

async function handleMiniAppRemoved(data: any) {
  // Track miniapp removal
  console.log('User removed miniapp:', data.fid)
}