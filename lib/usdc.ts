// USDC precision helpers - all money operations use BigInt for 6-decimal precision

/** Convert various inputs to USDC wei (6 decimals) */
export const toUsdc = (x: string | number | bigint): bigint => {
  if (typeof x === 'bigint') return x
  if (typeof x === 'string') {
    // Handle decimal strings like "100.50"
    const cleaned = x.replace(/[,$\s]/g, '')
    if (!/^\d+(\.\d{1,6})?$/.test(cleaned)) {
      throw new Error(`Invalid USDC amount: ${x}`)
    }
    const num = parseFloat(cleaned)
    return BigInt(Math.round(num * 1e6))
  }
  return BigInt(Math.round(Number(x) * 1e6))
}

/** Calculate 2% monthly interest: principal * 1.02 */
export const mul102 = (principal: bigint): bigint => {
  return (principal * BigInt(10200)) / BigInt(10000)
}

/** Format USDC wei as human-readable string */
export const fmtUsdc = (wei: bigint, decimals: number = 2): string => {
  const num = Number(wei) / 1e6
  return num.toFixed(decimals)
}

/** Parse USDC amount ensuring it's within valid range */
export const parseUsdc = (amount: string | number, min = 1, max = 10000): bigint => {
  const wei = toUsdc(amount)
  const usdc = Number(wei) / 1e6
  
  if (usdc < min || usdc > max) {
    throw new Error(`USDC amount ${fmtUsdc(wei)} must be between $${min} and $${max}`)
  }
  
  return wei
}

/** Check if two USDC amounts are approximately equal (within 1 micro-USDC) */
export const usdcEqual = (a: bigint, b: bigint, tolerance = BigInt(1)): boolean => {
  return a >= b - tolerance && a <= b + tolerance
}

// Constants
export const USDC_DECIMALS = 6
export const USDC_UNIT = BigInt(1000000) // 10^6
export const MIN_LOAN_USDC = toUsdc(1) // $1 minimum
export const MAX_LOAN_USDC = toUsdc(10000) // $10k maximum
export const MONTHLY_RATE_BPS = 200 // 2% = 200 basis points

// Base blockchain constants  
export const BASE_CHAIN_ID = 8453
export const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'