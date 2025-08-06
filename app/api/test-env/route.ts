import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
    const trimmedServiceKey = supabaseServiceKey?.trim()
    
    return NextResponse.json({
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlLength: supabaseUrl?.length || 0,
      serviceKeyLength: supabaseServiceKey?.length || 0,
      trimmedServiceKeyLength: trimmedServiceKey?.length || 0,
      // First and last 10 chars for debugging (safe to expose these)
      urlStart: supabaseUrl?.substring(0, 10),
      urlEnd: supabaseUrl?.substring(supabaseUrl.length - 10),
      serviceKeyStart: supabaseServiceKey?.substring(0, 10),
      serviceKeyEnd: supabaseServiceKey?.substring(supabaseServiceKey.length - 10),
      trimmedServiceKeyEnd: trimmedServiceKey?.substring(trimmedServiceKey.length - 10),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check environment variables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}