import { NextRequest, NextResponse } from 'next/server'
import { ImageResponse } from 'next/og'

export async function GET(request: NextRequest) {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #8A63D2 0%, #7C4DFF 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'system-ui',
          }}
        >
          <div style={{ fontSize: 72, marginBottom: 20 }}>🏦</div>
          <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 20 }}>
            LoanCast
          </div>
          <div style={{ fontSize: 24, marginBottom: 40, textAlign: 'center' }}>
            Social Lending on Farcaster
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '20px 40px',
              borderRadius: 16,
              fontSize: 18,
              textAlign: 'center',
            }}
          >
            Fixed 2% monthly rate • 1-3 month terms
            <br />
            Loans as collectible casts
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e) {
    console.error('Error generating frame image:', e)
    return new NextResponse('Failed to generate image', { status: 500 })
  }
}

export const runtime = 'edge'