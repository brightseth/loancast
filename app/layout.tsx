import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { AuthButton } from '../components/AuthButton'

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
                    <a href="/explore" className="text-gray-700 hover:text-[#6936F5]">
                      Explore
                    </a>
                    <a href="/admin" className="text-gray-500 hover:text-[#6936F5] text-sm">
                      Admin
                    </a>
                    <AuthButton />
                  </div>

                  {/* Mobile hamburger */}
                  <div className="md:hidden">
                    <AuthButton />
                  </div>
                </div>

                {/* Mobile nav menu - you can expand this later */}
                <div className="md:hidden border-t border-gray-200 pt-2 pb-3 space-y-1">
                  <a href="/loans" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-[#6936F5]">
                    My Loans
                  </a>
                  <a href="/explore" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-[#6936F5]">
                    Explore
                  </a>
                  <a href="/admin" className="block px-3 py-2 text-sm font-medium text-gray-500 hover:text-[#6936F5]">
                    Admin
                  </a>
                </div>
              </div>
            </nav>
            <main className="bg-white">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  )
}