import { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'

interface Props {
  params: { id: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    // Fetch loan data
    const { data: loan } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!loan) {
      return {
        title: 'Loan Not Found - LoanCast',
        description: 'The requested loan could not be found.',
      }
    }

    const loanAmount = loan.gross_usdc || 0
    const repayAmount = loan.repay_usdc || 0
    const loanId = loan.id.slice(0, 6).toUpperCase()
    const dueDate = new Date(loan.due_ts).toLocaleDateString()
    const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/loans/${params.id}/frame/image`
    const frameUrl = `${process.env.NEXT_PUBLIC_APP_URL}/loans/${params.id}/frame`

    return {
      title: `LoanCast - $${loanAmount.toLocaleString()} USDC Loan`,
      description: `${loan.status === 'funded' ? 'Funded' : 'Seeking lender'} • $${loanAmount} USDC loan • Repay $${repayAmount.toFixed(0)} • Due ${dueDate} • 2% monthly rate`,
      openGraph: {
        title: `🏦 $${loanAmount.toLocaleString()} USDC Loan - LoanCast`,
        description: `${loan.status === 'funded' ? 'Funded' : 'Seeking lender'} • Repay $${repayAmount.toFixed(0)} USDC • Due ${dueDate}`,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `LoanCast loan for $${loanAmount} USDC`,
          },
        ],
        type: 'website',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/loans/${params.id}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: `🏦 $${loanAmount.toLocaleString()} USDC Loan`,
        description: `${loan.status === 'funded' ? 'Funded' : 'Seeking lender'} • 2% monthly • Due ${dueDate}`,
        images: [imageUrl],
      },
      other: {
        // Farcaster Frame meta tags
        'fc:frame': 'vNext',
        'fc:frame:image': imageUrl,
        'fc:frame:image:aspect_ratio': '1.91:1',
        'fc:frame:button:1': 'View Details',
        'fc:frame:button:1:action': 'link',
        'fc:frame:button:1:target': `${process.env.NEXT_PUBLIC_APP_URL}/loans/${params.id}`,
        'fc:frame:button:2': 'View Cast',
        'fc:frame:button:2:action': 'link',
        'fc:frame:button:2:target': `https://warpcast.com/~/conversations/${loan.cast_hash}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'LoanCast - Decentralized Social Lending',
      description: 'Borrow from friends on Farcaster with no credit checks, no collateral.',
    }
  }
}

export default function LoanLayout({ children }: Props) {
  return children
}