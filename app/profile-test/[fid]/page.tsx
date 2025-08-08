import { getUserByFid } from '@/lib/neynar'
import { supabase } from '@/lib/supabase'
import LoanCard from '@/components/LoanCard'
import { notFound } from 'next/navigation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function getProfileData(fid: string) {
  try {
    const fidNum = parseInt(fid)
    
    // Get user from Neynar
    const user = await getUserByFid(fidNum)
    
    if (!user) {
      // Fallback for test users
      if ([1, 2, 3, 5046, 12345].includes(fidNum)) {
        return {
          fid: fidNum,
          display_name: fidNum === 5046 ? 'Seth (@seth)' : `Test User ${fidNum}`,
          username: fidNum === 5046 ? 'seth' : `testuser${fidNum}`,
          pfp_url: `https://i.pravatar.cc/100?img=${fidNum}`,
          follower_count: 100,
          following_count: 50,
          total_loans: 0,
          loans_repaid: 0,
          loans_defaulted: 0,
          total_borrowed: 0,
          credit_score: 50,
        }
      }
      return null
    }
    
    // Transform to our user format
    return {
      fid: fidNum,
      display_name: (user as any).display_name || 'Unknown',
      username: (user as any).username || 'unknown',
      pfp_url: (user as any).pfp_url || '',
      follower_count: (user as any).follower_count || 0,
      following_count: (user as any).following_count || 0,
      total_loans: 0,
      loans_repaid: 0,
      loans_defaulted: 0,
      total_borrowed: 0,
      credit_score: 50,
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

async function getLoans(fid: string) {
  try {
    const [borrowedRes, lentRes] = await Promise.all([
      supabase
        .from('loans')
        .select('*')
        .eq('borrower_fid', parseInt(fid))
        .order('created_at', { ascending: false }),
      supabase
        .from('loans')
        .select('*')
        .eq('lender_fid', parseInt(fid))
        .order('created_at', { ascending: false })
    ])
    
    return {
      borrowed: borrowedRes.data || [],
      lent: lentRes.data || []
    }
  } catch (error) {
    console.error('Error fetching loans:', error)
    return { borrowed: [], lent: [] }
  }
}

export default async function ProfileTestPage({ params }: { params: { fid: string } }) {
  const [user, loans] = await Promise.all([
    getProfileData(params.fid),
    getLoans(params.fid)
  ])
  
  if (!user) {
    notFound()
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-start gap-6">
          {user.pfp_url && (
            <img
              src={user.pfp_url}
              alt={user.display_name}
              className="w-20 h-20 rounded-full"
            />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {user.display_name}
            </h1>
            <p className="text-gray-600 mb-4">
              @{user.username} • FID: {user.fid}
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#6936F5]">{user.total_loans}</div>
                <div className="text-sm text-gray-600">Total Loans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{user.loans_repaid}</div>
                <div className="text-sm text-gray-600">Repaid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#6936F5]">${user.total_borrowed}</div>
                <div className="text-sm text-gray-600">Borrowed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{user.credit_score}</div>
                <div className="text-sm text-gray-600">Credit Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loans Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Loan History</h2>
          <div className="mt-4 space-y-2">
            <div className="text-sm text-gray-600">
              Borrowed: {loans.borrowed.length} loans
            </div>
            <div className="text-sm text-gray-600">
              Lent: {loans.lent.length} loans
            </div>
          </div>
        </div>
        
        {/* Borrowed Loans */}
        {loans.borrowed.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">As Borrower</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loans.borrowed.map(loan => (
                <LoanCard key={loan.id} loan={loan} userRole="borrower" />
              ))}
            </div>
          </div>
        )}
        
        {/* Lent Loans */}
        {loans.lent.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-4">As Lender</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loans.lent.map(loan => (
                <LoanCard key={loan.id} loan={loan} userRole="lender" />
              ))}
            </div>
          </div>
        )}
        
        {loans.borrowed.length === 0 && loans.lent.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No loan history yet
          </div>
        )}
      </div>
    </div>
  )
}