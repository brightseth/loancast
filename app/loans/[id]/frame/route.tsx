import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Fetch loan data
    const { data: loan } = await supabaseAdmin
      .from('loans')
      .select('*')
      .eq('id', id)
      .single()

    if (!loan) {
      return new NextResponse('Loan not found', { status: 404 })
    }

    const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/loans/${id}/frame/image`
    const loanAmount = loan.repay_usdc && loan.yield_bps ? 
      ((loan.repay_usdc * 10000) / (10000 + loan.yield_bps)).toFixed(0) : '0'
    
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>LoanCast - $${loanAmount} USDC Loan</title>
          
          <!-- Frame Meta Tags -->
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          <meta property="fc:frame:button:1" content="View Details" />
          <meta property="fc:frame:button:1:action" content="link" />
          <meta property="fc:frame:button:1:target" content="${process.env.NEXT_PUBLIC_APP_URL}/loans/${id}" />
          <meta property="fc:frame:button:2" content="View Cast" />
          <meta property="fc:frame:button:2:action" content="link" />
          <meta property="fc:frame:button:2:target" content="https://warpcast.com/~/conversations/${loan.cast_hash}" />
          
          <!-- Open Graph -->
          <meta property="og:title" content="LoanCast - $${loanAmount} USDC Loan" />
          <meta property="og:description" content="2% monthly rate • ${loan.status} • Cast #${loan.cast_hash.slice(2, 8)}" />
          <meta property="og:image" content="${imageUrl}" />
        </head>
        <body>
          <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
            <div style="text-align: center;">
              <h1>🏦 $${loanAmount} USDC Loan</h1>
              <p>Status: ${loan.status}</p>
              <p><a href="/loans/${id}">View Details</a></p>
            </div>
          </div>
        </body>
      </html>`,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    )
  } catch (error) {
    console.error('Error generating loan frame:', error)
    return new NextResponse('Error generating frame', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { id } = await request.json()
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/loans/${id}`)
}