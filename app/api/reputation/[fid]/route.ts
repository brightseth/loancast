import { NextRequest, NextResponse } from 'next/server'
import { getPublicReputationData } from '@/lib/reputation'
import { withRateLimit, rateLimiters } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  // Rate limiting
  const { result, response } = await withRateLimit(request, rateLimiters.api)
  if (response) return response

  try {
    const fid = params.fid

    if (!fid) {
      return NextResponse.json(
        { error: 'Invalid FID' },
        { status: 400 }
      )
    }

    const reputation = await getPublicReputationData(fid)

    if (!reputation) {
      return NextResponse.json(
        { error: 'Failed to calculate reputation' },
        { status: 500 }
      )
    }

    return NextResponse.json(reputation)
  } catch (error) {
    console.error('Error fetching reputation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reputation' },
      { status: 500 }
    )
  }
}