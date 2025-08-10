// Analytics stub - replace with real implementation
export const analytics = {
  featureUsed: (feature: string) => console.log('Analytics:', feature),
  formStarted: (form: string) => console.log('Form started:', form),
  formCompleted: (form: string) => console.log('Form completed:', form),
  formAbandoned: (form: string, reason: string) => console.log('Form abandoned:', form, reason),
  loanCreated: (data: any) => console.log('Loan created:', data),
  searchPerformed: (term: string, filters: any, results: number) => console.log('Search performed:', { term, filters, results }),
  errorOccurred: (error: any) => console.log('Error occurred:', error)
}

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