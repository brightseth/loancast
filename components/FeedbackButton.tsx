'use client'

import { useState } from 'react'

interface FeedbackButtonProps {
  className?: string
  variant?: 'button' | 'link'
  location?: string
}

export function FeedbackButton({ 
  className = '', 
  variant = 'button',
  location = 'unknown'
}: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [type, setType] = useState<'bug' | 'feature' | 'general'>('general')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) return

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          feedback,
          location,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        setSubmitted(true)
        setTimeout(() => {
          setIsOpen(false)
          setSubmitted(false)
          setFeedback('')
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const buttonClasses = variant === 'link' 
    ? `text-gray-500 hover:text-gray-700 text-sm ${className}`
    : `bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 text-sm ${className}`

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={buttonClasses}
      >
        {variant === 'link' ? 'Report Issue' : '💬 Feedback'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            {submitted ? (
              <div className="text-center">
                <div className="text-green-500 text-2xl mb-2">✅</div>
                <h3 className="font-semibold mb-2">Thanks for your feedback!</h3>
                <p className="text-sm text-gray-600">We'll review it and make improvements.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 className="font-semibold mb-4">Send Feedback</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="bug">🐛 Bug Report</option>
                    <option value="feature">💡 Feature Request</option>
                    <option value="general">💬 General Feedback</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    {type === 'bug' ? 'What went wrong?' : 'What\'s on your mind?'}
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={type === 'bug' ? 'Describe the issue you encountered...' : 'Share your thoughts...'}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 resize-none"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !feedback.trim()}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}