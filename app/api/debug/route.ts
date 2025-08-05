import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    hasNeynarKey: !!process.env.NEYNAR_API_KEY,
    supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
    timestamp: new Date().toISOString()
  })
}