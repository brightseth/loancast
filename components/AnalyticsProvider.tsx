'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { analytics } from '@/lib/analytics'

interface AnalyticsProviderProps {
  children: React.ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname()

  // Initialize analytics on mount
  useEffect(() => {
    analytics.init()
  }, [])

  // Track page views on route change
  useEffect(() => {
    analytics.pageView(pathname)
  }, [pathname])

  // Track performance metrics
  useEffect(() => {
    // Track Core Web Vitals if available
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Largest Contentful Paint
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.entryType === 'largest-contentful-paint') {
              analytics.performanceMetric('LCP', Math.round(entry.startTime))
            }
          })
        })
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (error) {
        console.warn('LCP tracking not supported')
      }

      // First Input Delay
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.entryType === 'first-input') {
              analytics.performanceMetric('FID', Math.round(entry.processingStart - entry.startTime))
            }
          })
        })
        observer.observe({ entryTypes: ['first-input'], buffered: true })
      } catch (error) {
        console.warn('FID tracking not supported')
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
        })
        observer.observe({ entryTypes: ['layout-shift'], buffered: true })

        // Report CLS when page visibility changes
        const reportCLS = () => {
          analytics.performanceMetric('CLS', Math.round(clsValue * 1000) / 1000, 'score')
        }

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            reportCLS()
          }
        })
      } catch (error) {
        console.warn('CLS tracking not supported')
      }
    }
  }, [])

  return <>{children}</>
}