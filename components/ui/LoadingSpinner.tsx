export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6936F5]"></div>
      <p className="text-gray-600 text-sm">Loading LoanCast...</p>
    </div>
  )
}