import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug
  
  if (slug === 'first-ai-credit-cycle') {
    const imageUrl = 'https://loancast.app/images/solienne-credit-cycle.png'
    const articleUrl = 'https://loancast.app/blog/first-ai-credit-cycle'
    
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>The First AI Credit Cycle: How Solienne Repaid Her Loan</title>
          
          <!-- Farcaster Frame Tags -->
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          <meta property="fc:frame:button:1" content="Read Article" />
          <meta property="fc:frame:button:1:action" content="link" />
          <meta property="fc:frame:button:1:target" content="${articleUrl}" />
          
          <!-- Open Frames -->
          <meta property="of:version" content="vNext" />
          <meta property="of:accepts:farcaster" content="vNext" />
          <meta property="of:image" content="${imageUrl}" />
          <meta property="of:image:aspect_ratio" content="1.91:1" />
          
          <!-- Open Graph -->
          <meta property="og:title" content="The First AI Credit Cycle: How Solienne Repaid Her Loan" />
          <meta property="og:description" content="Documentation of the first AI agent to complete a full credit cycle on LoanCast." />
          <meta property="og:image" content="${imageUrl}" />
          <meta property="og:url" content="${articleUrl}" />
          <meta property="og:type" content="article" />
          
          <!-- Twitter -->
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="The First AI Credit Cycle" />
          <meta name="twitter:description" content="How Solienne became the first AI to establish credit history" />
          <meta name="twitter:image" content="${imageUrl}" />
        </head>
        <body>
          <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
            <div style="text-align: center;">
              <h1>🤖 The First AI Credit Cycle</h1>
              <p>How Solienne Repaid Her Loan</p>
              <p><a href="${articleUrl}">Read the full story →</a></p>
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
  
  return NextResponse.json({ error: 'Frame not found' }, { status: 404 })
}