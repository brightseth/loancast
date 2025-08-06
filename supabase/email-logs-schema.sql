-- Email logs table to track sent emails and prevent duplicates
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  recipient_fid BIGINT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('payment_reminder', 'loan_funded', 'loan_repaid', 'loan_defaulted')),
  reminder_type TEXT, -- '3day', '1day', 'overdue' for payment reminders
  sent_successfully BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  email_provider TEXT, -- 'resend', 'sendgrid', etc.
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_loan_id ON email_logs(loan_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_fid ON email_logs(recipient_fid);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_reminder_type ON email_logs(loan_id, reminder_type) WHERE reminder_type IS NOT NULL;

-- User email preferences (optional - if users want to provide emails)
CREATE TABLE IF NOT EXISTS user_email_preferences (
  user_fid BIGINT PRIMARY KEY,
  email TEXT,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Email notification preferences
  payment_reminders BOOLEAN DEFAULT true,
  loan_funded BOOLEAN DEFAULT true,
  loan_repaid BOOLEAN DEFAULT true,
  loan_defaulted BOOLEAN DEFAULT true,
  marketing BOOLEAN DEFAULT false,
  
  -- Reminder timing preferences
  reminder_3day BOOLEAN DEFAULT true,
  reminder_1day BOOLEAN DEFAULT true,
  reminder_overdue BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_email_preferences_fid ON user_email_preferences(user_fid);

-- Function to get user's email if available
CREATE OR REPLACE FUNCTION get_user_email(p_user_fid BIGINT)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT email 
    FROM user_email_preferences 
    WHERE user_fid = p_user_fid 
      AND email_verified = true 
      AND payment_reminders = true
  );
END;
$$ LANGUAGE plpgsql;