import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    console.log('=== SIMPLE SUPABASE TEST ===')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/\s+/g, '')
    
    console.log('URL:', supabaseUrl)
    console.log('Service key length:', supabaseServiceKey.length)
    console.log('Service key start:', supabaseServiceKey.substring(0, 20))
    console.log('Service key end:', supabaseServiceKey.substring(supabaseServiceKey.length - 20))
    
    // Test creating client
    const client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    
    console.log('Client created successfully')
    
    // Test simple query
    const { data, error } = await client
      .from('loans')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Query error:', error)
      return NextResponse.json({ 
        error: 'Query failed', 
        details: error.message,
        code: error.code 
      }, { status: 500 })
    }
    
    console.log('Query successful:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}