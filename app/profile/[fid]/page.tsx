
import ProfileTabs from '@/components/ProfileTabs'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function getProfileData(fid: string) {
  try {
    // In server components, use absolute URL for API calls
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://loancast.app'
    const response = await fetch(`${baseUrl}/api/profiles/${fid}`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    })
    
    if (!response.ok) {
      console.error(`Profile API error: ${response.status} ${response.statusText}`)
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

async function getLoans(fid: string) {
  try {
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://loancast.app'
    
    const [borrowedRes, lentRes] = await Promise.all([
      fetch(`${baseUrl}/api/loans?borrower_fid=${fid}`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/loans?lender_fid=${fid}`, { cache: 'no-store' })
    ])
    
    const borrowed = borrowedRes.ok ? await borrowedRes.json() : []
    const lent = lentRes.ok ? await lentRes.json() : []
    
    return { borrowed, lent }
  } catch (error) {
    console.error('Error fetching loans:', error)
    return { borrowed: [], lent: [] }
  }
}


function LoanCard({ loan, userRole }: { loan: any, userRole: 'borrower' | 'lender' }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-gray-600">
          #{loan.loan_number || loan.id.slice(0, 8)}
        </span>
        <span className={`text-xs px-2 py-1 rounded ${
          loan.status === 'open' ? 'bg-blue-100 text-blue-700' :
          loan.status === 'funded' ? 'bg-yellow-100 text-yellow-700' :
          loan.status === 'repaid' ? 'bg-green-100 text-green-700' :
          'bg-red-100 text-red-700'
        }`}>
          {loan.status}
        </span>
      </div>
      <div className="text-2xl font-bold mb-1">
        ${loan.amount_usdc || loan.gross_usdc || loan.net_usdc}
      </div>
      <div className="text-sm text-gray-600 mb-3">
        Due: {new Date(loan.due_ts).toLocaleDateString()}
      </div>
      {userRole === 'borrower' && loan.status === 'funded' && (
        <div className="text-sm text-amber-600 mb-2">
          Repay: ${loan.repay_usdc?.toFixed(2)}
        </div>
      )}
      <a 
        href={`/loans/${loan.id}`}
        className="block text-center bg-[#6936F5] text-white py-2 rounded hover:bg-purple-700 transition-colors"
      >
        View Details
      </a>
    </div>
  )
}

// ProfileTabs component moved to /components/ProfileTabs.tsx for client-side interactivity

export default async function ProfilePage({ params }: { params: { fid: string } }) {
  const [user, loans] = await Promise.all([
    getProfileData(params.fid),
    getLoans(params.fid)
  ])
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
          <p className="text-gray-600 mb-4">
            FID {params.fid} doesn't exist or hasn't used LoanCast yet.
          </p>
          <div className="text-sm text-gray-500 mb-4">
            <p>FID: {params.fid}</p>
          </div>
          <a
            href="/explore"
            className="bg-[#6936F5] text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Browse Loans
          </a>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          {user.pfp_url && (
            <img
              src={user.pfp_url}
              alt={user.display_name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex-shrink-0"
            />
          )}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              {user.display_name}
            </h1>
            <p className="text-gray-600 mb-4">
              {user.username && `@${user.username} • `}FID: {user.fid}
            </p>
            
            {/* Bio */}
            {user.bio && (
              <p className="text-gray-700 mb-4 text-sm sm:text-base">
                {typeof user.bio === 'object' ? user.bio.text : user.bio}
              </p>
            )}
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-[#6936F5]">{user.total_loans || 0}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Loans</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{user.loans_repaid || 0}</div>
                <div className="text-xs sm:text-sm text-gray-600">Repaid</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-[#6936F5]">
                  ${(user.total_borrowed || 0).toFixed(0)}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Total Borrowed</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-amber-600">{user.credit_score || 50}</div>
                <div className="text-xs sm:text-sm text-gray-600">Credit Score</div>
              </div>
            </div>

            {/* Additional Stats */}
            {(user.follower_count || user.following_count) && (
              <div className="flex justify-center sm:justify-start gap-6 mt-4 text-sm text-gray-600">
                {user.follower_count && (
                  <div>
                    <span className="font-medium">{user.follower_count.toLocaleString()}</span> followers
                  </div>
                )}
                {user.following_count && (
                  <div>
                    <span className="font-medium">{user.following_count.toLocaleString()}</span> following
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reputation Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Reputation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-green-600">
              {user.repayment_streak || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Repayment Streak</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-blue-600">
              {user.avg_repayment_days ? `${user.avg_repayment_days.toFixed(1)} days` : 'N/A'}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Avg Repayment Time</div>
          </div>
          <div className="text-center col-span-2 sm:col-span-1">
            <div className="text-lg sm:text-xl font-bold text-red-600">
              {user.loans_defaulted || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Defaults</div>
          </div>
        </div>
        
        {/* Power Badge */}
        {user.power_badge && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              ⚡ Power User
            </span>
          </div>
        )}
      </div>

      {/* Loans Section */}
      <ProfileTabs borrowed={loans.borrowed} lent={loans.lent} />
    </div>
  )
}