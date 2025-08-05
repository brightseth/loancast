export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (address.length <= startChars + endChars) return address
  return `${address.slice(0, startChars)}…${address.slice(-endChars)}`
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}