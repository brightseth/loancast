'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to explore after 3 seconds with a toast message
    const timer = setTimeout(() => {
      router.push('/explore?from=404')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loan Not Found</h2>
          <p className="text-gray-600 mb-6">
            This loan may have been deleted by the borrower or the link is invalid.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <span className="font-medium">🔄 Auto-redirecting</span> to explore page in 3 seconds...
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/explore"
            className="block w-full bg-farcaster text-white py-3 px-6 rounded-lg font-medium hover:bg-farcaster-dark transition"
          >
            Browse Active Loans
          </Link>
          
          <Link
            href="/"
            className="block w-full text-gray-600 hover:text-farcaster transition"
          >
            ← Back to Homepage
          </Link>
        </div>

        <div className="mt-8 text-xs text-gray-500">
          <p>Looking for help? <Link href="/faq" className="text-farcaster hover:underline">Check our FAQ</Link></p>
        </div>
      </div>
    </div>
  )
}