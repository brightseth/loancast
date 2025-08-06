import { supabase } from './supabase'
import { createFundingCast, createRepaymentCast } from './neynar'

export type NotificationType = 'loan_funded' | 'loan_repaid' | 'payment_reminder' | 'loan_defaulted' | 'new_bid'

export interface Notification {
  id: string
  user_fid: number
  type: NotificationType
  title: string
  message: string
  loan_id?: string
  read_at?: string
  created_at: string
  metadata?: Record<string, any>
}

export interface NotificationPreferences {
  user_fid: number
  email_notifications: boolean
  push_notifications: boolean
  cast_notifications: boolean
  loan_funded: boolean
  loan_repaid: boolean
  payment_reminders: boolean
  loan_defaulted: boolean
  new_bids: boolean
  reminder_hours: number
}

class NotificationService {
  // Create a notification
  async createNotification(
    userFid: number,
    type: NotificationType,
    title: string,
    message: string,
    loanId?: string,
    metadata?: Record<string, any>
  ): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_fid: userFid,
          type,
          title,
          message,
          loan_id: loanId,
          metadata: metadata || {}
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating notification:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to create notification:', error)
      return null
    }
  }

  // Get notifications for a user
  async getUserNotifications(
    userFid: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_fid', userFid)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching notifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      return []
    }
  }

  // Get unread notification count
  async getUnreadCount(userFid: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_count', { p_user_fid: userFid })

      if (error) {
        console.error('Error getting unread count:', error)
        return 0
      }

      return data || 0
    } catch (error) {
      console.error('Failed to get unread count:', error)
      return 0
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)

      return !error
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      return false
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userFid: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_fid', userFid)
        .is('read_at', null)

      return !error
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      return false
    }
  }

  // Get user notification preferences
  async getPreferences(userFid: number): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_fid', userFid)
        .single()

      if (error) {
        // If no preferences exist, create default ones
        if (error.code === 'PGRST116') {
          return await this.createDefaultPreferences(userFid)
        }
        console.error('Error fetching preferences:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
      return null
    }
  }

  // Create default notification preferences
  async createDefaultPreferences(userFid: number): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_fid: userFid,
          email_notifications: true,
          push_notifications: true,
          cast_notifications: true,
          loan_funded: true,
          loan_repaid: true,
          payment_reminders: true,
          loan_defaulted: true,
          new_bids: false,
          reminder_hours: 24
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating default preferences:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to create default preferences:', error)
      return null
    }
  }

  // Update notification preferences
  async updatePreferences(
    userFid: number,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_fid: userFid,
          ...preferences,
          updated_at: new Date().toISOString()
        })

      return !error
    } catch (error) {
      console.error('Failed to update preferences:', error)
      return false
    }
  }

  // Loan-specific notification methods
  async notifyLoanFunded(
    borrowerFid: number,
    loanId: string,
    lenderName: string,
    amount: number,
    signerUuid?: string,
    originalCastHash?: string
  ): Promise<void> {
    const title = 'Loan Funded! 🎉'
    const message = `${lenderName} has funded your ${amount.toLocaleString()} USDC loan`

    // Create notification
    await this.createNotification(borrowerFid, 'loan_funded', title, message, loanId, {
      lender_name: lenderName,
      amount
    })

    // Create cast notification if enabled and we have the necessary data
    if (signerUuid && originalCastHash) {
      try {
        await createFundingCast(signerUuid, loanId, originalCastHash, lenderName, 'borrower', amount)
      } catch (error) {
        console.error('Failed to create funding cast:', error)
      }
    }
  }

  async notifyLoanRepaid(
    lenderFid: number,
    loanId: string,
    borrowerName: string,
    amount: number,
    onTime: boolean = true,
    signerUuid?: string,
    originalCastHash?: string
  ): Promise<void> {
    const title = onTime ? 'Loan Repaid ✅' : 'Loan Repaid (Late) ⚠️'
    const message = `${borrowerName} has repaid ${amount.toLocaleString()} USDC ${onTime ? 'on time' : 'late'}`

    // Create notification
    await this.createNotification(lenderFid, 'loan_repaid', title, message, loanId, {
      borrower_name: borrowerName,
      amount,
      on_time: onTime
    })

    // Create cast notification if enabled and we have the necessary data
    if (signerUuid && originalCastHash) {
      try {
        await createRepaymentCast(signerUuid, loanId, originalCastHash, borrowerName, amount, onTime)
      } catch (error) {
        console.error('Failed to create repayment cast:', error)
      }
    }
  }

  async notifyPaymentReminder(
    borrowerFid: number,
    loanId: string,
    amount: number,
    dueDate: Date,
    hoursUntilDue: number
  ): Promise<void> {
    const title = `Payment Reminder ⏰`
    const message = `Your ${amount.toLocaleString()} USDC loan is due in ${hoursUntilDue} hours`

    await this.createNotification(borrowerFid, 'payment_reminder', title, message, loanId, {
      amount,
      due_date: dueDate.toISOString(),
      hours_until_due: hoursUntilDue
    })
  }

  async notifyLoanDefaulted(
    lenderFid: number,
    borrowerFid: number,
    loanId: string,
    amount: number,
    borrowerName: string,
    lenderName: string
  ): Promise<void> {
    // Notify lender
    await this.createNotification(
      lenderFid,
      'loan_defaulted',
      'Loan Defaulted 💔',
      `${borrowerName}'s ${amount.toLocaleString()} USDC loan has defaulted`,
      loanId,
      { borrower_name: borrowerName, amount }
    )

    // Notify borrower
    await this.createNotification(
      borrowerFid,
      'loan_defaulted',
      'Loan Marked as Default ⚠️',
      `Your ${amount.toLocaleString()} USDC loan to ${lenderName} has been marked as defaulted`,
      loanId,
      { lender_name: lenderName, amount }
    )
  }
}

export const notificationService = new NotificationService()