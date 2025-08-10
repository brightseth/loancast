import { ImageResponse } from 'next/og'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          fontSize: 32,
          fontWeight: 600,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              fontSize: 64,
              marginRight: 20,
            }}
          >
            🏦
          </div>
          <div
            style={{
              fontSize: 48,
              color: '#6936F5',
              fontWeight: 700,
            }}
          >
            LoanCast
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: '#4b5563',
            marginBottom: 40,
          }}
        >
          Decentralized Social Lending on Base
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: 40,
            marginTop: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 28, marginRight: 8 }}>✅</span>
            <span style={{ fontSize: 20 }}>No Credit Checks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 28, marginRight: 8 }}>🤝</span>
            <span style={{ fontSize: 20 }}>Friend-to-Friend</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 28, marginRight: 8 }}>💰</span>
            <span style={{ fontSize: 20 }}>2% Monthly Yield</span>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            marginTop: 60,
            fontSize: 20,
            color: '#6b7280',
          }}
        >
          loancast.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}