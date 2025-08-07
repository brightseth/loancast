'use client'

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong!
        </h1>
        <p className="text-gray-600 mb-4">
          We couldn't load this profile. This might be a temporary issue.
        </p>
        <div className="text-sm text-gray-500 mb-4">
          <details className="cursor-pointer">
            <summary>Error details</summary>
            <pre className="mt-2 text-xs text-left bg-gray-100 p-2 rounded overflow-auto">
              {error.message || 'Unknown error'}
            </pre>
          </details>
        </div>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="bg-[#6936F5] text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try again
          </button>
          <a
            href="/explore"
            className="inline-block px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go to Explore
          </a>
        </div>
      </div>
    </div>
  )
}