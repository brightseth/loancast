import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY ? 
  process.env.SUPABASE_SERVICE_KEY.trim().replace(/\s+/g, '') : 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export type Loan = {
  id: string
  loan_number?: number
  cast_hash: string
  borrower_fid: number
  lender_fid: number | null
  gross_usdc: number | null
  net_usdc: number | null
  yield_bps: number
  repay_usdc: number
  start_ts: string
  due_ts: string
  status: 'open' | 'funded' | 'repaid' | 'default' | 'deleted'
  tx_fund: string | null
  tx_repay: string | null
  funded_at: string | null
  notes: string | null
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
  loans_defaulted: number
  total_borrowed: number
  total_repaid: number
  avg_repayment_days: number | null
  repayment_streak: number
  follower_count: number | null
  cast_count: number | null
  account_created_at: string | null
  verified_wallet: string | null
  reputation_badges: any[]
  created_at: string
  updated_at: string
}