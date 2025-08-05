'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'

interface SnackBarProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose?: () => void
}

export function SnackBar({ message, type = 'info', duration = 3000, onClose }: SnackBarProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      if (onClose) onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className={`flex items-center p-4 rounded-lg border shadow-lg ${getBackgroundColor()}`}>
        {getIcon()}
        <span className="ml-3 text-sm font-medium flex-1">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false)
            if (onClose) onClose()
          }}
          className="ml-3 text-gray-400 hover:text-gray-600"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}