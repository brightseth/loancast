import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
}

export function createApiError(message: string, statusCode: number = 500, code?: string): ApiError {
  const error = new Error(message) as ApiError
  error.statusCode = statusCode
  error.code = code
  return error
}

export function handleApiError(error: unknown, context?: Record<string, any>) {
  let apiError: ApiError
  
  if (error instanceof Error) {
    apiError = error as ApiError
  } else {
    apiError = createApiError('Unknown error occurred')
  }

  // Log to Sentry with context
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value)
      })
    }
    
    scope.setTag('api_error', true)
    scope.setLevel('error')
    
    if (apiError.code) {
      scope.setTag('error_code', apiError.code)
    }
    
    Sentry.captureException(apiError)
  })

  // Don't log in development to avoid noise
  if (process.env.NODE_ENV !== 'development') {
    console.error('API Error:', apiError.message, context)
  }

  const statusCode = apiError.statusCode || 500
  const message = process.env.NODE_ENV === 'production' && statusCode >= 500
    ? 'Internal server error'
    : apiError.message

  return NextResponse.json(
    { 
      error: message,
      code: apiError.code || 'UNKNOWN_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: apiError.stack })
    },
    { status: statusCode }
  )
}

export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  context?: Record<string, any>
): Promise<T | NextResponse> {
  try {
    return await handler()
  } catch (error) {
    return handleApiError(error, context)
  }
}