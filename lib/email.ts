// Email service for sending loan reminders and notifications
// Using a simple approach that can work with various email providers

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface EmailRecipient {
  email: string
  name: string
  fid: number
}

export interface LoanReminderData {
  loanId: string
  loanNumber: string
  borrowerName: string
  lenderName: string
  amount: number
  dueDate: Date
  daysUntilDue: number
  repaymentUrl: string
}

class EmailService {
  private apiKey: string | undefined
  private fromEmail: string
  private fromName: string

  constructor() {
    // Support multiple email providers via environment variables
    this.apiKey = process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY
    this.fromEmail = process.env.EMAIL_FROM || 'notifications@loancast.app'
    this.fromName = process.env.EMAIL_FROM_NAME || 'LoanCast'
  }

  // Generate reminder email templates
  generatePaymentReminderTemplate(data: LoanReminderData): EmailTemplate {
    const { loanNumber, borrowerName, amount, dueDate, daysUntilDue, repaymentUrl } = data
    
    const urgencyLevel = daysUntilDue <= 1 ? 'urgent' : daysUntilDue <= 3 ? 'warning' : 'reminder'
    const urgencyEmoji = urgencyLevel === 'urgent' ? '🚨' : urgencyLevel === 'warning' ? '⚠️' : '⏰'
    
    const subject = daysUntilDue <= 1 
      ? `${urgencyEmoji} Payment Due Tomorrow - ${loanNumber}`
      : daysUntilDue <= 0
      ? `${urgencyEmoji} Payment Overdue - ${loanNumber}`
      : `${urgencyEmoji} Payment Reminder - ${loanNumber} due in ${daysUntilDue} days`

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment Reminder - ${loanNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background: linear-gradient(135deg, #6936f5, #8b5cf6); color: white; padding: 32px 24px; text-align: center; }
    .content { padding: 32px 24px; }
    .urgency-banner { padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center; font-weight: 600; }
    .urgency-urgent { background-color: #fee2e2; color: #dc2626; border: 2px solid #fca5a5; }
    .urgency-warning { background-color: #fef3c7; color: #d97706; border: 2px solid #fde68a; }
    .urgency-reminder { background-color: #dbeafe; color: #2563eb; border: 2px solid #93c5fd; }
    .loan-details { background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .detail-label { color: #6b7280; }
    .detail-value { font-weight: 600; color: #111827; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #6936f5, #8b5cf6); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }
    .footer { background-color: #f3f4f6; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
    .trust-note { background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">💸 LoanCast</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">Social lending on Farcaster</p>
    </div>
    
    <div class="content">
      <div class="urgency-banner urgency-${urgencyLevel}">
        ${urgencyEmoji} ${subject.replace(urgencyEmoji, '').trim()}
      </div>
      
      <p style="font-size: 18px; margin-bottom: 8px;">Hi ${borrowerName},</p>
      
      <p>This is a friendly reminder about your upcoming loan repayment on LoanCast.</p>
      
      <div class="loan-details">
        <h3 style="margin-top: 0; color: #374151;">Loan Details</h3>
        <div class="detail-row">
          <span class="detail-label">Loan ID:</span>
          <span class="detail-value">${loanNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount to Repay:</span>
          <span class="detail-value">$${amount.toLocaleString()} USDC</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Due Date:</span>
          <span class="detail-value">${dueDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time Remaining:</span>
          <span class="detail-value">${daysUntilDue <= 0 ? 'OVERDUE' : `${daysUntilDue} days`}</span>
        </div>
      </div>
      
      <div class="trust-note">
        <p style="margin: 0; font-size: 14px; color: #0c4a6e;">
          <strong>🤝 Trust-Based Lending</strong><br>
          Your reputation on LoanCast depends on timely repayments. On-time payments improve your credit score and unlock better loan terms in the future.
        </p>
      </div>
      
      <div style="text-align: center;">
        <a href="${repaymentUrl}" class="cta-button">REPAY LOAN NOW</a>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
        Need help? Reply to this email or reach out on Farcaster <a href="https://warpcast.com/loancast">@loancast</a>
      </p>
    </div>
    
    <div class="footer">
      <p>You're receiving this because you have an active loan on LoanCast.</p>
      <p>LoanCast - Social lending made simple</p>
      <p><a href="https://loancast.app">loancast.app</a> | Built on Farcaster</p>
    </div>
  </div>
</body>
</html>`

    const text = `
Payment Reminder - ${loanNumber}

Hi ${borrowerName},

This is a reminder about your upcoming loan repayment on LoanCast.

Loan Details:
- Loan ID: ${loanNumber}
- Amount to Repay: $${amount.toLocaleString()} USDC
- Due Date: ${dueDate.toLocaleDateString()}
- Time Remaining: ${daysUntilDue <= 0 ? 'OVERDUE' : `${daysUntilDue} days`}

Your reputation on LoanCast depends on timely repayments. On-time payments improve your credit score and unlock better loan terms.

Repay your loan: ${repaymentUrl}

Need help? Reply to this email or reach out on Farcaster @loancast

---
LoanCast - Social lending made simple
loancast.app
`

    return { subject, html, text }
  }

  generateLoanFundedTemplate(data: LoanReminderData): EmailTemplate {
    const { loanNumber, borrowerName, lenderName, amount, dueDate, repaymentUrl } = data
    
    const subject = `🎉 Your loan ${loanNumber} has been funded!`

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Loan Funded - ${loanNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 32px 24px; text-align: center; }
    .content { padding: 32px 24px; }
    .success-banner { background-color: #d1fae5; color: #065f46; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center; font-weight: 600; border: 2px solid #6ee7b7; }
    .loan-details { background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .detail-label { color: #6b7280; }
    .detail-value { font-weight: 600; color: #111827; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #6936f5, #8b5cf6); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 24px 0; }
    .footer { background-color: #f3f4f6; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">🎉 LoanCast</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">Your loan has been funded!</p>
    </div>
    
    <div class="content">
      <div class="success-banner">
        🎉 Great news! ${lenderName} has funded your loan
      </div>
      
      <p style="font-size: 18px; margin-bottom: 8px;">Hi ${borrowerName},</p>
      
      <p>Congratulations! Your loan request has been successfully funded by ${lenderName}. The funds should be in your wallet shortly.</p>
      
      <div class="loan-details">
        <h3 style="margin-top: 0; color: #374151;">Loan Details</h3>
        <div class="detail-row">
          <span class="detail-label">Loan ID:</span>
          <span class="detail-value">${loanNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Funded by:</span>
          <span class="detail-value">${lenderName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total to Repay:</span>
          <span class="detail-value">$${amount.toLocaleString()} USDC</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Due Date:</span>
          <span class="detail-value">${dueDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>
      
      <p><strong>Next steps:</strong></p>
      <ol>
        <li>Check your wallet for the funds</li>
        <li>Mark your calendar for the repayment date</li>
        <li>Repay on time to build your reputation</li>
      </ol>
      
      <div style="text-align: center;">
        <a href="${repaymentUrl}" class="cta-button">VIEW LOAN DETAILS</a>
      </div>
    </div>
    
    <div class="footer">
      <p>LoanCast - Social lending made simple</p>
      <p><a href="https://loancast.app">loancast.app</a> | Built on Farcaster</p>
    </div>
  </div>
</body>
</html>`

    const text = `
Your loan ${loanNumber} has been funded!

Hi ${borrowerName},

Great news! ${lenderName} has funded your loan request.

Loan Details:
- Loan ID: ${loanNumber}
- Funded by: ${lenderName}
- Total to Repay: $${amount.toLocaleString()} USDC
- Due Date: ${dueDate.toLocaleDateString()}

Next steps:
1. Check your wallet for the funds
2. Mark your calendar for the repayment date  
3. Repay on time to build your reputation

View loan details: ${repaymentUrl}

---
LoanCast - Social lending made simple
loancast.app
`

    return { subject, html, text }
  }

  // Send email using available provider
  async sendEmail(to: EmailRecipient, template: EmailTemplate): Promise<boolean> {
    if (!this.apiKey) {
      console.log('📧 Email preview (no API key configured):')
      console.log(`To: ${to.email} (${to.name})`)
      console.log(`Subject: ${template.subject}`)
      console.log(`Preview: ${template.text.substring(0, 200)}...`)
      return false
    }

    try {
      // Try Resend first (most popular for Next.js apps)
      if (process.env.RESEND_API_KEY) {
        return await this.sendWithResend(to, template)
      }

      // Fallback to SendGrid
      if (process.env.SENDGRID_API_KEY) {
        return await this.sendWithSendGrid(to, template)
      }

      console.log('No email provider configured')
      return false
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  private async sendWithResend(to: EmailRecipient, template: EmailTemplate): Promise<boolean> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to.email],
        subject: template.subject,
        html: template.html,
        text: template.text,
      }),
    })

    return response.ok
  }

  private async sendWithSendGrid(to: EmailRecipient, template: EmailTemplate): Promise<boolean> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to.email, name: to.name }],
          subject: template.subject,
        }],
        from: { email: this.fromEmail, name: this.fromName },
        content: [
          { type: 'text/plain', value: template.text },
          { type: 'text/html', value: template.html },
        ],
      }),
    })

    return response.status === 202
  }

  // Send payment reminder
  async sendPaymentReminder(data: LoanReminderData, borrowerEmail?: string): Promise<boolean> {
    if (!borrowerEmail) {
      console.log(`No email available for borrower ${data.borrowerName}`)
      return false
    }

    const recipient: EmailRecipient = {
      email: borrowerEmail,
      name: data.borrowerName,
      fid: 0 // Will be populated if we have this data
    }

    const template = this.generatePaymentReminderTemplate(data)
    return await this.sendEmail(recipient, template)
  }

  // Send loan funded notification
  async sendLoanFunded(data: LoanReminderData, borrowerEmail?: string): Promise<boolean> {
    if (!borrowerEmail) {
      console.log(`No email available for borrower ${data.borrowerName}`)
      return false
    }

    const recipient: EmailRecipient = {
      email: borrowerEmail,
      name: data.borrowerName,
      fid: 0
    }

    const template = this.generateLoanFundedTemplate(data)
    return await this.sendEmail(recipient, template)
  }
}

export const emailService = new EmailService()