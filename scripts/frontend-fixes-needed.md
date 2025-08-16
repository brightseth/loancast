# 🔧 Frontend Fixes Needed for Solienne's Loan Display

## Current Display Issues

### ❌ What's Wrong:
1. **"Borrower: Human 👤"** → Should be **"Borrower: Agent 🤖"**
2. **"APR: 0.00%"** → Should be **"APR: 24.3%"**
3. **"$0 USDC loan"** → Should be **"$80 USDC loan"**
4. **"Platform Fee: $0.00"** → Should be **"Platform Fee: $8.00"** (10%)
5. **"🚀 Auto Fund"** button → Should be removed

## Files That Likely Need Fixes

### 1. Loan Card Component
Look for files like:
- `components/LoanCard.tsx`
- `components/ExploreCard.tsx`
- `app/loans/[id]/page.tsx`

### 2. Specific Fixes Needed

#### Fix 1: Borrower Type Display
```typescript
// WRONG
const borrowerType = 'human'; // or defaulting to human

// CORRECT
const borrowerType = loan.borrower_type || 'human';
const borrowerEmoji = borrowerType === 'agent' ? '🤖' : '👤';
```

#### Fix 2: APR Calculation
```typescript
// WRONG
const apr = 0; // or not calculating

// CORRECT
const days = Math.round((new Date(loan.due_ts) - new Date(loan.start_ts)) / 86400000);
const interest = loan.repay_usdc - loan.gross_usdc;
const monthlyRate = (interest / loan.gross_usdc) * (30 / days);
const apr = monthlyRate * 12 * 100; // ~24.3%
```

#### Fix 3: Loan Amount Display
```typescript
// WRONG
const amount = 0; // or wrong field

// CORRECT
const amount = loan.gross_usdc; // 80
```

#### Fix 4: Platform Fee Calculation
```typescript
// WRONG
const platformFee = 0;

// CORRECT
const platformFee = loan.gross_usdc * 0.1; // 8.00
const netToBorrower = loan.gross_usdc - platformFee; // 72.00
```

#### Fix 5: Remove Auto-Fund Button
```typescript
// REMOVE THIS
<button>🚀 Auto Fund</button>

// KEEP ONLY
<button>Collect</button> // or "Fund"
```

## Database Values (Correct)

```javascript
{
  borrower_fid: 1113468,    // Solienne
  borrower_type: 'agent',   // ✅ Correct
  gross_usdc: 80,           // ✅ Correct
  repay_usdc: 80.27,        // ✅ Correct
  status: 'seeking'         // ✅ Correct
}
```

## What the UI Should Show

```
#solienne
$80.27 Total repayment

User 1113468 (Solienne)
Open
Borrower: Agent 🤖        ← FIXED
🟡 Medium Risk

APR: 24.3%                ← FIXED
Duration: 5 days
Due Date: Aug 21, 2025

Amount Requested: $80.00   ← FIXED
Platform Fee: $8.00        ← FIXED
Net to Borrower: $72.00    ← ADDED

📱 Farcaster Cast

🏦 $80 USDC loan • 2% monthly • Due 8/21  ← FIXED

[Collect] [View Cast]      ← NO AUTO-FUND
```

## Quick Test

Run this in console to verify database has correct values:
```javascript
// Check loan data
fetch('/api/loans/0fd92bda-5b08-48b0-84f8-403c10d2929a')
  .then(r => r.json())
  .then(loan => {
    console.log('borrower_type:', loan.borrower_type); // Should be 'agent'
    console.log('gross_usdc:', loan.gross_usdc);       // Should be 80
    console.log('repay_usdc:', loan.repay_usdc);       // Should be 80.27
  });
```

## The Issue

The backend/database is perfect. The frontend components are:
1. Not reading the `borrower_type` field
2. Not calculating APR
3. Not displaying the correct amount
4. Not calculating platform fees
5. Still showing auto-fund buttons

These are all UI component bugs that need fixing in the React/Next.js code.