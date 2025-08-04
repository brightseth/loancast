import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/frame-image.png`
  
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>LoanCast - Social Lending on Farcaster</title>
        
        <!-- Frame Meta Tags -->
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageUrl}" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <meta property="fc:frame:button:1" content="Create Loan" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="${process.env.NEXT_PUBLIC_APP_URL}/loans/new" />
        <meta property="fc:frame:button:2" content="Browse Loans" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content="${process.env.NEXT_PUBLIC_APP_URL}/explore" />
        
        <!-- Open Graph -->
        <meta property="og:title" content="LoanCast - Social Lending on Farcaster" />
        <meta property="og:description" content="Fixed rate loans as collectible casts. 2% monthly, 1-3 month terms." />
        <meta property="og:image" content="${imageUrl}" />
        
        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LoanCast" />
        <meta name="twitter:description" content="Social lending on Farcaster" />
        <meta name="twitter:image" content="${imageUrl}" />
      </head>
      <body>
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <h1>🏦 LoanCast</h1>
            <p>Social lending on Farcaster</p>
            <p><a href="/loans/new">Create Loan</a> | <a href="/explore">Browse Loans</a></p>
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
}

export async function POST(request: NextRequest) {
  // Handle Frame actions
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/loans/new`)
}