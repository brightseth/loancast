import { NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function getProfileData(fid: string) {
  try {
    // In server components, use absolute URL for API calls
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://loancast.app'
    const response = await fetch(`${baseUrl}/api/profiles/${fid}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
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

export default async function SimpleProfilePage({ params }: { params: { fid: string } }) {
  const [user, loans] = await Promise.all([
    getProfileData(params.fid),
    getLoans(params.fid)
  ])
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
          <p className="text-gray-600">FID {params.fid} doesn't exist or hasn't used LoanCast yet.</p>
          <a href="/explore" className="mt-4 inline-block text-[#6936F5] hover:underline">
            Browse active loans →
          </a>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          {user.pfp_url && (
            <img
              src={user.pfp_url}
              alt={user.display_name}
              className="w-20 h-20 rounded-full"
            />
          )}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {user.display_name}
            </h1>
            <p className="text-gray-600 mb-4">
              @{user.username} • FID: {user.fid}
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#6936F5]">{user.total_loans || 0}</div>
                <div className="text-sm text-gray-600">Total Loans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{user.loans_repaid || 0}</div>
                <div className="text-sm text-gray-600">Repaid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#6936F5]">
                  ${(user.total_borrowed || 0).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Borrowed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{user.credit_score || 50}</div>
                <div className="text-sm text-gray-600">Credit Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loans Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Loan History</h2>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button className="px-4 py-2 font-medium border-b-2 border-[#6936F5] text-[#6936F5]">
            Borrowed ({loans.borrowed.length})
          </button>
          <button className="px-4 py-2 font-medium text-gray-600">
            Lent ({loans.lent.length})
          </button>
        </div>
        
        {/* Loan Grid */}
        {loans.borrowed.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loans.borrowed.map((loan: any) => (
              <div key={loan.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    #{loan.loan_number || loan.id.slice(0, 8)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    loan.status === 'seeking' ? 'bg-blue-100 text-blue-700' :
                    loan.status === 'funded' ? 'bg-yellow-100 text-yellow-700' :
                    loan.status === 'repaid' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {loan.status}
                  </span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  ${loan.amount_usdc}
                </div>
                <div className="text-sm text-gray-600">
                  Due: {new Date(loan.due_ts).toLocaleDateString()}
                </div>
                <a 
                  href={`/loans/${loan.id}`}
                  className="mt-3 block text-center bg-[#6936F5] text-white py-2 rounded hover:bg-purple-700"
                >
                  View Details
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No loans as borrower yet
          </div>
        )}
      </div>
    </div>
  )
}