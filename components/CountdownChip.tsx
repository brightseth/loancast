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
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`)
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s left`)
      } else {
        setTimeLeft(`${seconds}s left`)
      }
    }

    updateCountdown()
    // Update every second when less than 1 hour, every minute otherwise
    const now = new Date()
    const diff = dueDate.getTime() - now.getTime()
    const updateInterval = diff < 60 * 60 * 1000 ? 1000 : 60000
    
    const interval = setInterval(updateCountdown, updateInterval)

    return () => clearInterval(interval)
  }, [dueDate])

  const isOverdue = timeLeft === 'overdue'
  const isDueSoon = () => {
    const now = new Date()
    const diff = dueDate.getTime() - now.getTime()
    const hours = diff / (1000 * 60 * 60)
    return hours <= 24 && !isOverdue // Due within 24 hours
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      isOverdue 
        ? 'bg-red-100 text-red-800 animate-pulse'
        : isDueSoon()
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-gray-100 text-gray-600'
    } ${className}`}>
      {timeLeft}
    </span>
  )
}