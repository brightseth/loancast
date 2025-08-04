import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LoanCast - Social Lending on Farcaster',
  description: 'Fixed rate loans as collectible casts. 2% monthly, 1-3 month terms.',
  openGraph: {
    title: 'LoanCast - Social Lending on Farcaster',
    description: 'Fixed rate loans as collectible casts. 2% monthly, 1-3 month terms.',
    images: [`${process.env.NEXT_PUBLIC_APP_URL}/api/frame/image`],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoanCast',
    description: 'Social lending on Farcaster',
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
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <a href="/" className="text-2xl font-bold text-farcaster">
                      LoanCast
                    </a>
                  </div>
                  <div className="flex items-center space-x-4">
                    <a href="/loans" className="text-gray-700 hover:text-farcaster">
                      My Loans
                    </a>
                    <a href="/explore" className="text-gray-700 hover:text-farcaster">
                      Explore
                    </a>
                    <div id="auth-button"></div>
                  </div>
                </div>
              </div>
            </nav>
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  )
}