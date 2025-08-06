-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_fid BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('loan_funded', 'loan_repaid', 'payment_reminder', 'loan_defaulted', 'new_bid')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for efficient queries
CREATE INDEX idx_notifications_user_fid ON notifications(user_fid);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_fid, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_type ON notifications(type);

-- Notification preferences table
CREATE TABLE notification_preferences (
  user_fid BIGINT PRIMARY KEY,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  cast_notifications BOOLEAN DEFAULT true,
  loan_funded BOOLEAN DEFAULT true,
  loan_repaid BOOLEAN DEFAULT true,
  payment_reminders BOOLEAN DEFAULT true,
  loan_defaulted BOOLEAN DEFAULT true,
  new_bids BOOLEAN DEFAULT false,
  reminder_hours INTEGER DEFAULT 24 CHECK (reminder_hours IN (1, 6, 12, 24, 48)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_count(p_user_fid BIGINT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications 
    WHERE user_fid = p_user_fid AND read_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;