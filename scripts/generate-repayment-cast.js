#!/usr/bin/env node
/**
 * LoanCast — Repayment Cast Generator (single-cast, framed style)
 * Usage: node scripts/generate-repayment-cast.js <loanId>
 */
import 'dotenv/config'

const LOAN_ID = process.argv[2]
if (!LOAN_ID) {
  console.error('Usage: node scripts/generate-repayment-cast.js <loanId>')
  process.exit(1)
}

const BASE = (process.env.NEXT_PUBLIC_APP_URL || 'https://loancast.app').replace(/\/+$/, '')
const LOAN_URL = `${BASE}/loans/${LOAN_ID}?src=repay-cast`

function fmtUSD(n) {
  if (n == null || Number.isNaN(Number(n))) return null
  return Number(n).toFixed(2)
}

function daysBetween(a, b) {
  const ms = Math.max(0, b.getTime() - a.getTime())
  return Math.max(1, Math.round(ms / 86_400_000))
}

function shortTx(tx) {
  return tx && tx.startsWith('0x') ? tx : null
}

async function main() {
  // Fetch loan from your API
  const res = await fetch(`${BASE}/api/loans/${LOAN_ID}`)
  if (!res.ok) {
    console.error(`Failed to fetch loan: ${res.status} ${res.statusText}`)
    process.exit(1)
  }
  const loan = await res.json()

  // Derive fields
  const amountRepaid =
    loan.repaid_usdc ??
    loan.repay_usdc ??               // total due if you track it
    loan.gross_usdc ??               // fallback to funded
    loan.requested_usdc ?? null

  const amountStr = fmtUSD(amountRepaid) || '0.00'

  const start = loan.start_ts ? new Date(loan.start_ts) : null
  const end =
    loan.repay_ts ? new Date(loan.repay_ts) :
    loan.updated_at ? new Date(loan.updated_at) :
    new Date()
  const days = start ? daysBetween(start, end) : null

  const tx = shortTx(loan.tx_repay || loan.tx_fund || loan.tx_hash)
  const txUrl = tx ? `https://basescan.org/tx/${tx}` : null

  // Best-effort recipient handle
  // If your API returns lender_username, use it; else fall back to FID.
  const toHandle =
    (loan.lender_username && `@${loan.lender_username}`) ||
    (loan.lender_handle && `@${loan.lender_handle}`) ||
    (loan.lender_fid != null ? `FID ${loan.lender_fid}` : 'lender')

  // Build the cast text
  const topRule = '-------------------------'
  const bottomRule = topRule

  const daysSuffix = days ? ` (in ${days} days)` : ''
  const lines = [
    topRule,
    `✅ Loan repaid on time — ${amountStr} USDC → ${toHandle}${daysSuffix}`,
    '',
    'Trust-based lending on Farcaster.',
    '',
    `📊 Details: ${LOAN_URL}`,
    txUrl ? `⛓️ Tx: ${txUrl}` : null,
    '',
    `Who's next to borrow or lend? /loancast`,
    bottomRule
  ].filter(Boolean)

  const castBody = lines.join('\n')

  // Pretty console output with copy block
  const banner = '📝 REPAYMENT CAST READY'
  const underline = '='.repeat(banner.length)
  console.log(`${banner}\n${underline}\n`)
  console.log('Copy this text and paste into Warpcast:\n')
  console.log('---START COPY HERE---')
  console.log(castBody)
  console.log('---END COPY HERE---\n')

  // Optional: human-readable summary
  console.log('📊 Loan Summary:')
  console.log(`- Amount: ${amountStr}`)
  console.log(`- Status: ${loan.status || 'repaid'}`)
  if (days) console.log(`- Days to repay: ${days}`)
  if (tx) console.log(`- Tx: ${tx}`)
  if (loan.cast_hash) console.log(`- Cast hash: ${loan.cast_hash}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})