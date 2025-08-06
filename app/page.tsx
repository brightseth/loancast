'use client'

import { useAuth } from './providers'
import Link from 'next/link'
import { ActivityFeed } from '@/components/ActivityFeed'
import { useEffect, useState } from 'react'

export default function Home() {
  const { user, login } = useAuth()
  const [stats, setStats] = useState<{
    totalLoans: number
    totalFunded: number
    totalVolume: number
  }>({ totalLoans: 0, totalFunded: 0, totalVolume: 0 })

  useEffect(() => {
    // Fetch platform statistics
    fetch('/api/loans/list')
      .then(res => res.json())
      .then(loans => {
        const funded = loans.filter((loan: any) => loan.status === 'funded')
        const totalVolume = funded.reduce((sum: number, loan: any) => sum + (loan.gross_usdc || 0), 0)
        
        setStats({
          totalLoans: loans.length,
          totalFunded: funded.length,
          totalVolume
        })
      })
      .catch(err => console.error('Failed to fetch stats:', err))
  }, [])

  return (
    <div className="min-h-screen px-4">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center min-h-screen gap-8">
        {/* Left side - Main message */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Borrow from friends
          </h1>
          
          <p className="text-xl text-zinc-600 mb-8 max-w-md mx-auto lg:mx-0">
            No banks. No credit checks. No collateral.
            Just post what you need.
          </p>
          
          {/* Single CTA */}
          {!user ? (
            <button
              onClick={login}
              className="bg-[#6936F5] hover:bg-[#5733d9] text-white text-lg px-8 py-4 rounded-full font-medium transform transition hover:scale-105 mb-4"
            >
              Cast your loan →
            </button>
          ) : (
            <Link
              href="/loans/new"
              className="inline-block bg-[#6936F5] hover:bg-[#5733d9] text-white text-lg px-8 py-4 rounded-full font-medium transform transition hover:scale-105 mb-4"
            >
              Cast your loan →
            </Link>
          )}
          
          {/* Trust signal - real platform stats */}
          <p className="text-sm text-zinc-500">
            {stats.totalFunded > 0 ? (
              `$${stats.totalVolume.toLocaleString()} funded • ${stats.totalLoans} loan${stats.totalLoans === 1 ? '' : 's'} created`
            ) : (
              'Loading platform stats...'
            )}
          </p>
        </div>

        {/* Right side - Real LoanCast example */}
        <div className="flex-1 max-w-sm">
          <p className="text-xs text-zinc-400 text-center mb-3">LOANCAST-001 (funded for $789):</p>
          <a 
            href="https://basescan.org/tx/0x019650f986916936dae462ccef30d5a8b9b41d3d6e2212dc088b622db44a06e5" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-center mb-4">
              <div className="text-xs font-mono border-2 border-zinc-300 rounded px-2 py-1 inline-block mb-3">
                LOANCAST-001
              </div>
            </div>
            
            <div className="space-y-2 text-xs text-zinc-700">
              <div className="flex items-center gap-2">
                <span>🏦</span>
                <span>Borrow ≤ 1 000 USDC</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span>30 days • due 2 Sep 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📈</span>
                <span>Yield 2 % → repay 1.02x</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🎯</span>
                <span>Highest bid = lender</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💰</span>
                <span>I eat Farcaster's 10 %</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>This cast *is* the note</span>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-zinc-200 flex items-center justify-between text-xs">
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">✅ Funded</span>
              <span className="text-zinc-500">Won by henry: $789</span>
            </div>
          </a>
          <p className="text-xs text-zinc-400 text-center mt-2">
            Click to view on-chain transaction ↗
          </p>
        </div>
      </div>
    </div>
  )
}