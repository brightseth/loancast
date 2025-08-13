import { useState, useEffect } from 'react'

export interface BorrowerStats {
  fid: number
  loans_total: number
  loans_repaid: number
  loans_on_time: number
  loans_late: number
  loans_defaulted: number
  principal_borrowed_usdc_6: number
  principal_repaid_usdc_6: number
  outstanding_usdc_6: number
  on_time_rate: number
  longest_on_time_streak: number
  last_repaid_at: string | null
  account_age_days: number
  followers: number
  ens_verified: boolean
  basename_verified: boolean
  score: number
  tier: 'A' | 'B' | 'C' | 'D'
  badges: Record<string, boolean>
  updated_at: string
}

export function useBorrowerStats(fid: number | null) {
  const [stats, setStats] = useState<BorrowerStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!fid) {
      setStats(null)
      return
    }

    const fetchStats = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/borrowers/${fid}/stats`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.status}`)
        }
        
        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error('Error fetching borrower stats:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setStats(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [fid])

  return { stats, loading, error }
}