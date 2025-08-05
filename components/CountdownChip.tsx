'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow, isPast } from 'date-fns'

interface CountdownChipProps {
  dueDate: Date
  className?: string
}

export function CountdownChip({ dueDate, className = '' }: CountdownChipProps) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const updateCountdown = () => {
      if (isPast(dueDate)) {
        setTimeLeft('overdue')
        return
      }

      const now = new Date()
      const diff = dueDate.getTime() - now.getTime()
      
      if (diff <= 0) {
        setTimeLeft('overdue')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      
      if (days > 0) {
        setTimeLeft(`in ${days}d`)
      } else if (hours > 0) {
        setTimeLeft(`in ${hours}h`)
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeft(`in ${minutes}m`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [dueDate])

  const isOverdue = timeLeft === 'overdue'
  const isDueSoon = timeLeft.includes('h') || timeLeft.includes('m') || (timeLeft.includes('d') && parseInt(timeLeft) <= 3)

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      isOverdue 
        ? 'bg-red-100 text-red-800'
        : isDueSoon
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-gray-100 text-gray-600'
    } ${className}`}>
      {timeLeft}
    </span>
  )
}