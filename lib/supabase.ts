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
  origin_cast_hash?: string
  borrower_fid: number
  lender_fid: number | null
  borrower_addr?: string | null
  lender_addr?: string | null
  amount_usdc?: string | null
  repay_expected_usdc?: string | null
  gross_usdc?: number | null  // Legacy field for backwards compatibility
  net_usdc?: number | null    // Legacy field for backwards compatibility
  repay_usdc?: number | null  // Legacy field for backwards compatibility
  yield_bps?: number
  description?: string | null
  due_ts: string
  status: 'seeking' | 'funded' | 'repaid' | 'defaulted' | 'draft'
  repay_tx_hash?: string | null
  verified_repayment?: boolean
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