// Analytics stub - no-op for simplicity  
export const analytics: any = new Proxy({}, {
  get: () => () => {} // Returns empty function for any method call
})

export function useAnalytics() {
  return {
    featureUsed: (feature: string) => {
      // Placeholder for analytics tracking
      console.log('Analytics:', feature)
    },
    formStarted: (form: string) => {
      console.log('Form started:', form)
    },
    formCompleted: (form: string) => {
      console.log('Form completed:', form)
    },
    formAbandoned: (form: string, reason: string) => {
      console.log('Form abandoned:', form, reason)
    },
    loanCreated: (data: any) => {
      console.log('Loan created:', data)
    },
    searchPerformed: (term: string, filters: any, results: number) => {
      console.log('Search performed:', { term, filters, results })
    },
    errorOccurred: (error: any) => {
      console.log('Error occurred:', error)
    }
  }
}