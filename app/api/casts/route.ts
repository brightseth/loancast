import { NextRequest, NextResponse } from 'next/server'

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fid = searchParams.get('fid')
    const cursor = searchParams.get('cursor')
    
    if (!fid) {
      return NextResponse.json(
        { error: 'FID parameter is required' },
        { status: 400 }
      )
    }

    // Fetch casts from user that contain "LOANCAST"
    const url = new URL('https://api.neynar.com/v2/farcaster/feed')
    url.searchParams.append('feed_type', 'filter')
    url.searchParams.append('filter_type', 'fids')
    url.searchParams.append('fids', fid)
    url.searchParams.append('limit', '50')
    if (cursor) {
      url.searchParams.append('cursor', cursor)
    }

    const response = await fetch(url.toString(), {
      headers: {
        'api_key': NEYNAR_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Filter for LoanCast posts
    const loanCasts = data.casts.filter((cast: any) => 
      cast.text.includes('LOANCAST') || 
      cast.text.includes('┏━') // Our formatted LoanCast border
    )

    // Extract loan data from casts
    const loans = loanCasts.map((cast: any) => {
      const text = cast.text
      
      // Extract loan number (LOANCAST-XXXX)
      const loanNumberMatch = text.match(/LOANCAST-(\d+)/)
      const loanNumber = loanNumberMatch ? loanNumberMatch[1] : null
      
      // Extract amount
      const amountMatch = text.match(/Borrow ≤ (\d+(?:,\d+)*) USDC/)
      const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : null
      
      // Extract yield percentage
      const yieldMatch = text.match(/Yield (\d+(?:\.\d+)?) %/)
      const yieldPercent = yieldMatch ? parseFloat(yieldMatch[1]) : null
      
      // Extract repay amount
      const repayMatch = text.match(/repay (\d+) USDC/)
      const repayAmount = repayMatch ? parseInt(repayMatch[1]) : null
      
      // Extract due date
      const dueMatch = text.match(/due ([A-Za-z]+ \d+ \d+)/)
      const dueDate = dueMatch ? dueMatch[1] : null
      
      return {
        cast_hash: cast.hash,
        cast_url: `https://warpcast.com/${cast.author.username}/${cast.hash}`,
        loan_number: loanNumber,
        amount,
        yield_percent: yieldPercent,
        repay_amount: repayAmount,
        due_date: dueDate,
        borrower_fid: cast.author.fid,
        borrower_username: cast.author.username,
        borrower_display_name: cast.author.display_name,
        borrower_pfp_url: cast.author.pfp_url,
        created_at: cast.timestamp,
        text: cast.text,
        reactions: {
          likes: cast.reactions.likes_count || 0,
          recasts: cast.reactions.recasts_count || 0
        }
      }
    })

    return NextResponse.json({
      loans,
      next_cursor: data.next?.cursor || null
    })
  } catch (error) {
    console.error('Error fetching casts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch casts' },
      { status: 500 }
    )
  }
}

// Search for all LoanCast posts across Farcaster
export async function POST(request: NextRequest) {
  try {
    const { query = 'LOANCAST', cursor } = await request.json()

    const url = new URL('https://api.neynar.com/v2/farcaster/cast/search')
    url.searchParams.append('q', query)
    url.searchParams.append('limit', '50')
    if (cursor) {
      url.searchParams.append('cursor', cursor)
    }

    const response = await fetch(url.toString(), {
      headers: {
        'api_key': NEYNAR_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Filter for actual LoanCast posts with our format
    const loanCasts = data.casts.filter((cast: any) => 
      cast.text.includes('┏━') && 
      cast.text.includes('LOANCAST-') &&
      cast.text.includes('Borrow ≤')
    )

    // Extract and format loan data
    const loans = loanCasts.map((cast: any) => {
      const text = cast.text
      
      // Extract loan details using regex
      const loanNumberMatch = text.match(/LOANCAST-(\d+)/)
      const amountMatch = text.match(/Borrow ≤ (\d+(?:,\d+)*) USDC/)
      const yieldMatch = text.match(/Yield (\d+(?:\.\d+)?) %/)
      const repayMatch = text.match(/repay (\d+) USDC/)
      const dueMatch = text.match(/due ([A-Za-z]+ \d+ \d+)/)
      const daysMatch = text.match(/(\d+) days/)
      
      return {
        cast_hash: cast.hash,
        cast_url: `https://warpcast.com/${cast.author.username}/${cast.hash}`,
        loan_number: loanNumberMatch ? `LOANCAST-${loanNumberMatch[1]}` : null,
        amount: amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : null,
        yield_percent: yieldMatch ? parseFloat(yieldMatch[1]) : null,
        repay_amount: repayMatch ? parseInt(repayMatch[1]) : null,
        due_date: dueMatch ? dueMatch[1] : null,
        duration_days: daysMatch ? parseInt(daysMatch[1]) : null,
        borrower: {
          fid: cast.author.fid,
          username: cast.author.username,
          display_name: cast.author.display_name,
          pfp_url: cast.author.pfp_url,
          verified_addresses: cast.author.verified_addresses
        },
        created_at: cast.timestamp,
        engagement: {
          likes: cast.reactions.likes_count || 0,
          recasts: cast.reactions.recasts_count || 0,
          replies: cast.replies.count || 0
        },
        text: cast.text
      }
    })

    return NextResponse.json({
      loans,
      total: loans.length,
      next_cursor: data.next?.cursor || null
    })
  } catch (error) {
    console.error('Error searching casts:', error)
    return NextResponse.json(
      { error: 'Failed to search casts' },
      { status: 500 }
    )
  }
}