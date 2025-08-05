'use client'

import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  endTime: string | Date
  onExpired?: () => void
  className?: string
}

export function CountdownTimer({ endTime, onExpired, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    seconds: number
    expired: boolean
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false })

  useEffect(() => {
    const updateTimer = () => {
      const end = new Date(endTime).getTime()
      const now = new Date().getTime()
      const difference = end - now

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true })
        if (onExpired) onExpired()
        return
      }

      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds, expired: false })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [endTime, onExpired])

  if (timeLeft.expired) {
    return (
      <div className={`text-center ${className}`}>
        <div className="text-lg font-bold text-red-500">
          ⏰ AUCTION ENDED
        </div>
        <div className="text-sm text-gray-500">
          Bidding has closed
        </div>
      </div>
    )
  }

  const formatNumber = (num: number) => num.toString().padStart(2, '0')

  return (
    <div className={`text-center ${className}`}>
      <div className="text-lg font-bold text-[#6936F5] mb-1">
        ⏰ TIME LEFT
      </div>
      <div className="flex items-center justify-center space-x-1 text-2xl font-mono font-bold">
        <div className="bg-gray-100 px-2 py-1 rounded">
          {formatNumber(timeLeft.hours)}
        </div>
        <span className="text-gray-400">:</span>
        <div className="bg-gray-100 px-2 py-1 rounded">
          {formatNumber(timeLeft.minutes)}
        </div>
        <span className="text-gray-400">:</span>
        <div className="bg-gray-100 px-2 py-1 rounded">
          {formatNumber(timeLeft.seconds)}
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        HH:MM:SS
      </div>
    </div>
  )
}