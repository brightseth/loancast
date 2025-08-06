import { NextRequest, NextResponse } from 'next/server'
import { getUserByFid } from '@/lib/neynar'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  // Check rate limit first - use api limiter for profile lookups
  const { result, response } = await withRateLimit(request, rateLimiters.api)
  if (response) return response

  try {
    const fid = parseInt(params.fid)
    
    if (isNaN(fid)) {
      return NextResponse.json(
        { error: 'Invalid FID' },
        { status: 400 }
      )
    }

    const user = await getUserByFid(fid)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return standardized profile data
    return NextResponse.json({
      display_name: (user as any).display_name || 'Unknown',
      username: (user as any).username || 'unknown',
      pfp_url: (user as any).pfp_url || '',
      follower_count: (user as any).follower_count || 0,
      following_count: (user as any).following_count || 0,
      power_badge: (user as any).power_badge || false,
      bio: (user as any).profile?.bio,
      verifications: (user as any).verifications || []
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}