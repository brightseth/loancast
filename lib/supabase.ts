import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export type Loan = {
  id: string
  cast_hash: string
  borrower_fid: number
  lender_fid: number | null
  gross_usdc: number | null
  net_usdc: number | null
  yield_bps: number
  repay_usdc: number
  start_ts: string
  due_ts: string
  status: 'open' | 'repaid' | 'default'
  tx_fund: string | null
  tx_repay: string | null
  created_at: string
  updated_at: string
}

export type User = {
  fid: number
  display_name: string
  pfp_url: string | null
  credit_score: number
  total_loans: number
  loans_repaid: number
  created_at: string
  updated_at: string
}