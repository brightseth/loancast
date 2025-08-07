# Email Testing Guide for LoanCast

## Quick Test URLs (Preview in Browser)

1. **Payment Reminder (3 days before due)**
   ```
   http://localhost:3000/api/test-email?days=3
   ```

2. **Payment Reminder (1 day before due)**
   ```
   http://localhost:3000/api/test-email?days=1
   ```

3. **Payment Overdue**
   ```
   http://localhost:3000/api/test-email?days=-1
   ```

4. **Loan Funded Email**
   ```
   http://localhost:3000/api/test-email?type=funded
   ```

## Setting Up Real Email Sending

### Option 1: Resend (Recommended - Free tier available)

1. Sign up at https://resend.com
2. Get your API key from the dashboard
3. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   EMAIL_FROM=notifications@yourdomain.com
   EMAIL_FROM_NAME=LoanCast
   ```

### Option 2: SendGrid

1. Sign up at https://sendgrid.com
2. Create an API key with "Mail Send" permissions
3. Add to `.env.local`:
   ```
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   EMAIL_FROM=notifications@yourdomain.com
   EMAIL_FROM_NAME=LoanCast
   ```

## Testing with Real Email

Once you have an API key configured, test sending to your email:

```
http://localhost:3000/api/test-email?email=your-email@example.com&days=3
```

This will actually send the email to the specified address.

## Testing the Cron Job

To manually trigger the email reminder cron job:

```bash
# First, set a CRON_SECRET in .env.local
CRON_SECRET=your-secret-key-here

# Then test the cron endpoint
curl -H "Authorization: Bearer your-secret-key-here" \
  http://localhost:3000/api/cron/email-reminders
```

## Email Templates Available

1. **Payment Reminders**
   - 3-day reminder (blue banner)
   - 1-day reminder (yellow/warning banner)
   - Overdue reminder (red/urgent banner)

2. **Loan Funded Notification**
   - Sent when a loan is funded
   - Green success banner
   - Includes loan details and next steps

## Vercel Cron Setup

To enable automatic email reminders on Vercel:

1. Add to `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/email-reminders",
       "schedule": "0 10 * * *"
     }]
   }
   ```

2. Set environment variables in Vercel dashboard:
   - `CRON_SECRET` (generate a secure random string)
   - `RESEND_API_KEY` or `SENDGRID_API_KEY`
   - `EMAIL_FROM` and `EMAIL_FROM_NAME`

## Troubleshooting

- **No emails sending**: Check console logs for "📧 Email preview" - this means no API key is configured
- **Email not received**: Check spam folder, verify API key is correct
- **Cron not running**: Verify CRON_SECRET matches in both .env and request header