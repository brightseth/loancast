'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  endTime: string | Date
  className?: string
  compact?: boolean
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

export function CountdownTimer({ endTime, className = '', compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endTimeMs = new Date(endTime).getTime()
      const now = Date.now()
      const difference = endTimeMs - now

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          total: difference
        }
      } else {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
      }
    }

    // Update immediately
    setTimeLeft(calculateTimeLeft())

    // Then update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime])

  const formatTime = (time: number) => {
    return time.toString().padStart(2, '0')
  }

  const getUrgencyStyle = () => {
    const { total } = timeLeft
    const oneHour = 60 * 60 * 1000
    const sixHours = 6 * oneHour

    if (total <= 0) return 'text-gray-500'
    if (total < oneHour) return 'text-red-600 animate-pulse'
    if (total < sixHours) return 'text-orange-600'
    return 'text-gray-700'
  }

  if (timeLeft.total <= 0) {
    return (
      <div className={`${className} ${getUrgencyStyle()}`}>
        <span className="text-sm font-medium">Auction ended</span>
      </div>
    )
  }

  if (compact) {
    // Compact format for cards/lists
    if (timeLeft.days > 0) {
      return (
        <div className={`${className} ${getUrgencyStyle()}`}>
          <span className="text-sm font-medium">
            {timeLeft.days}d {formatTime(timeLeft.hours)}h left
          </span>
        </div>
      )
    } else if (timeLeft.hours > 0) {
      return (
        <div className={`${className} ${getUrgencyStyle()}`}>
          <span className="text-sm font-medium">
            {timeLeft.hours}h {formatTime(timeLeft.minutes)}m left
          </span>
        </div>
      )
    } else {
      return (
        <div className={`${className} ${getUrgencyStyle()}`}>
          <span className="text-sm font-medium">
            {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)} left
          </span>
        </div>
      )
    }
  }

  // Full format for loan detail pages
  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Auction ends in:</span>
        <div className={`flex items-center gap-1 font-mono ${getUrgencyStyle()}`}>
          {timeLeft.days > 0 && (
            <>
              <span className="text-lg font-semibold">{timeLeft.days}</span>
              <span className="text-xs">d</span>
            </>
          )}
          <span className="text-lg font-semibold">{formatTime(timeLeft.hours)}</span>
          <span className="text-xs">h</span>
          <span className="text-lg font-semibold">{formatTime(timeLeft.minutes)}</span>
          <span className="text-xs">m</span>
          <span className="text-lg font-semibold">{formatTime(timeLeft.seconds)}</span>
          <span className="text-xs">s</span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
        <div 
          className={`h-1 rounded-full transition-all duration-1000 ${
            timeLeft.total < 60 * 60 * 1000 ? 'bg-red-500' : 
            timeLeft.total < 6 * 60 * 60 * 1000 ? 'bg-orange-500' : 
            'bg-blue-500'
          }`}
          style={{
            width: `${Math.max(0, Math.min(100, (timeLeft.total / (24 * 60 * 60 * 1000)) * 100))}%`
          }}
        />
      </div>
    </div>
  )
}