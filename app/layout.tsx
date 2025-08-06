import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { AuthButton } from '../components/AuthButton'
import { Analytics } from '@vercel/analytics/react'
import { ErrorBoundary } from '../components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LoanCast - Social Lending on Farcaster',
  description: 'Social lending with no credit check, no collateral. Fixed 2% monthly rate.',
  openGraph: {
    title: 'LoanCast - Social Lending on Farcaster',
    description: 'Social lending with no credit check, no collateral. Fixed 2% monthly rate.',
    images: [`${process.env.NEXT_PUBLIC_APP_URL}/api/frame/image`],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoanCast',
    description: 'Social lending with no credit check, no collateral',
    images: [`${process.env.NEXT_PUBLIC_APP_URL}/api/frame/image`],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/image`,
    'fc:frame:button:1': 'Create Loan',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': `${process.env.NEXT_PUBLIC_APP_URL}/loans/new`,
    'fc:frame:button:2': 'Browse Loans', 
    'fc:frame:button:2:action': 'link',
    'fc:frame:button:2:target': `${process.env.NEXT_PUBLIC_APP_URL}/explore`,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <div className="min-h-screen bg-zinc-50">
            <nav className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:justify-between">
                  <div className="flex items-center md:flex-1">
                    <a href="/" className="text-2xl font-bold text-[#6936F5] md:flex-shrink-0">
                      LoanCast
                    </a>
                  </div>
                  
                  {/* Desktop nav */}
                  <div className="hidden md:flex items-center space-x-4">
                    <a href="/loans" className="text-gray-700 hover:text-[#6936F5]">
                      My Loans
                    </a>
                    <a href="/dashboard/lending" className="text-gray-700 hover:text-[#6936F5]">
                      Lending
                    </a>
                    <a href="/explore" className="text-gray-700 hover:text-[#6936F5]">
                      Explore
                    </a>
                    <AuthButton />
                  </div>

                  {/* Mobile hamburger */}
                  <div className="md:hidden flex items-center space-x-2">
                    <AuthButton />
                  </div>
                </div>

                {/* Mobile nav menu with better touch targets */}
                <div className="md:hidden border-t border-gray-200 pt-3 pb-4 space-y-1 bg-gray-50">
                  <a 
                    href="/loans/new" 
                    className="block mx-3 px-4 py-3 text-center bg-[#6936F5] text-white font-medium rounded-lg hover:bg-purple-700 transition"
                  >
                    Create Loan
                  </a>
                  <a href="/loans" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-[#6936F5] hover:bg-white rounded-lg mx-3 transition">
                    My Loans
                  </a>
                  <a href="/dashboard/lending" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-[#6936F5] hover:bg-white rounded-lg mx-3 transition">
                    Lending
                  </a>
                  <a href="/explore" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-[#6936F5] hover:bg-white rounded-lg mx-3 transition">
                    Explore
                  </a>
                </div>
              </div>
            </nav>
            <main className="bg-white">{children}</main>
            
            {/* Fun compliance footer */}
            <footer className="bg-zinc-50 border-t border-zinc-200 py-6 px-4">
              <div className="max-w-4xl mx-auto text-center">
                <p className="text-xs sm:text-sm text-zinc-600 mb-2 leading-relaxed">
                  <span className="text-sm">💫</span> LoanCast facilitates trust-based loans between friends—no securities, no interest on deposits, just social reputation.
                </p>
                <div className="text-xs text-zinc-500 space-y-1 sm:space-y-0">
                  <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2">
                    <span>USDC is fully backed by <a href="https://www.centre.io/usdc" target="_blank" rel="noopener" className="text-[#6936F5] hover:underline">Circle</a></span>
                    <span className="hidden sm:inline">•</span>
                    <span>Not FDIC insured</span>
                    <span className="hidden sm:inline">•</span>
                    <a href="/faq" className="text-[#6936F5] hover:underline">FAQ</a>
                  </div>
                  <div className="sm:mt-1">
                    <span>Loans based on social trust, not credit scores</span>
                    <span className="ml-1 text-sm">🎭</span>
                    <span className="ml-1">Built for the vibes</span>
                  </div>
                </div>
              </div>
            </footer>
            </div>
          </Providers>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}