import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    // Test email data
    const testData = {
      loanId: 'test-123',
      loanNumber: 'LOANCAST-0001',
      borrowerName: 'Test User',
      lenderName: 'Test Lender',
      amount: 100,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      daysUntilDue: 3,
      repaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/loans/test-123`
    }

    // Get email from query params (optional)
    const searchParams = request.nextUrl.searchParams
    const testEmail = searchParams.get('email')
    const emailType = searchParams.get('type') || 'reminder' // 'reminder' or 'funded'

    let template
    if (emailType === 'funded') {
      template = emailService.generateLoanFundedTemplate(testData)
    } else {
      // Test different reminder types
      const reminderType = searchParams.get('days') || '3'
      testData.daysUntilDue = parseInt(reminderType)
      testData.dueDate = new Date(Date.now() + testData.daysUntilDue * 24 * 60 * 60 * 1000)
      template = emailService.generatePaymentReminderTemplate(testData)
    }

    // If email provided, try to send it
    if (testEmail) {
      const sent = await emailService.sendEmail(
        { email: testEmail, name: 'Test User', fid: 5046 },
        template
      )
      
      return NextResponse.json({
        message: sent ? 'Email sent successfully!' : 'Email preview only (no API key configured)',
        sent,
        template: {
          subject: template.subject,
          preview: template.text.substring(0, 200) + '...'
        }
      })
    }

    // Otherwise return HTML preview
    return new NextResponse(template.html, {
      headers: { 'Content-Type': 'text/html' }
    })
    
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: 'Failed to generate test email' },
      { status: 500 }
    )
  }
}