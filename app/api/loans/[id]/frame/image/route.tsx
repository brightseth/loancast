import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ImageResponse } from 'next/og'

// Remove edge runtime to fix Supabase compatibility
// export const runtime = 'edge'

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

    const loanAmount = loan.gross_usdc || 0
    const repayAmount = loan.repay_usdc || 0
    const dueDate = new Date(loan.due_ts).toLocaleDateString()
    const loanId = loan.id.slice(0, 6).toUpperCase()
    const description = loan.description || null

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
                fontSize: 48,
                marginRight: 16,
              }}
            >
              🏦
            </div>
            <div
              style={{
                fontSize: 36,
                color: '#6936F5',
                fontWeight: 700,
              }}
            >
              LoanCast
            </div>
          </div>

          {/* Loan Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'white',
              padding: 40,
              borderRadius: 16,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              border: '2px solid #e2e8f0',
              minWidth: 600,
            }}
          >
            {/* Loan ID */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontFamily: 'monospace',
                  border: '2px solid #6936F5',
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: '#f8fafc',
                  color: '#6936F5',
                }}
              >
                LOANCAST-{loanId}
              </div>
            </div>

            {/* Description */}
            {description && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  padding: '12px 20px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 22, marginRight: 8 }}>💬</span>
                <span style={{ fontSize: 20, color: '#4b5563', fontStyle: 'italic' }}>
                  {description}
                </span>
              </div>
            )}

            {/* Amount */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <span style={{ marginRight: 12, fontSize: 24 }}>💰</span>
              <span style={{ fontSize: 28, color: '#1f2937' }}>
                Borrow ${loanAmount.toLocaleString()} USDC
              </span>
            </div>

            {/* Repayment */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <span style={{ marginRight: 12, fontSize: 24 }}>📈</span>
              <span style={{ fontSize: 24, color: '#1f2937' }}>
                Repay ${repayAmount.toFixed(0)} USDC (2% monthly)
              </span>
            </div>

            {/* Due Date */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <span style={{ marginRight: 12, fontSize: 24 }}>📅</span>
              <span style={{ fontSize: 24, color: '#1f2937' }}>
                Due {dueDate}
              </span>
            </div>

            {/* Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 24,
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  padding: '12px 24px',
                  borderRadius: 8,
                  backgroundColor: loan.status === 'funded' ? '#dcfce7' : '#fef3c7',
                  color: loan.status === 'funded' ? '#166534' : '#92400e',
                }}
              >
                {loan.status === 'funded' ? '✅ Funded' : '🔍 Seeking Lender'}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 40,
              fontSize: 18,
              color: '#6b7280',
            }}
          >
            Decentralized Social Lending on Base
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('Error generating loan image:', error)
    return new NextResponse('Error generating image', { status: 500 })
  }
}