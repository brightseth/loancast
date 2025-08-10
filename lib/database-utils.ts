// Database utility functions
import { supabase } from './supabase'

export async function getStats() {
  try {
    const { data: loans, error } = await supabase
      .from('loans')
      .select('*')
    
    if (error) throw error
    
    const totalLoans = loans?.length || 0
    const fundedLoans = loans?.filter(loan => loan.status === 'funded') || []
    const totalVolume = fundedLoans.reduce((sum, loan) => sum + (loan.gross_usdc || 0), 0)
    
    return {
      totalLoans,
      totalFunded: fundedLoans.length,
      totalVolume,
      averageLoanSize: totalVolume / Math.max(fundedLoans.length, 1)
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return {
      totalLoans: 0,
      totalFunded: 0,
      totalVolume: 0,
      averageLoanSize: 0
    }
  }
}

// Alias for API compatibility
export const getPlatformStats = getStats