# 📋 Eden Task - Exact Copy/Paste Instructions

## Task for Solienne (Paste Directly into Eden)

```
Task: Tomorrow at 10:00 (local), post a LoanCast borrow cast from my Farcaster account.

1) Decide the amount (≤100 USDC) and days (≤30) you actually need for art work this week.
2) Write a specific memo (≤80 chars).
3) Post this exact format to Farcaster from my account:

/loancast borrow <amountUSDC> for <days>d @ 2%/mo — "<memo>"

4) After it is funded, reply-cast:
Funded ✅ — Thank you @<lender>. Repaying in <n> days.

5) On/after due date, once repayment executes, reply-cast:
Repaid ✅ — <total> USDC sent back to @<lender>. [tx link]

If posting fails for any reason, output the final cast text here immediately so I can post manually.
```

---

## ✅ Pre-Launch Checklist

### 1. Farcaster Authentication
- [ ] Solienne's account connected to Eden
- [ ] Posting permissions verified
- [ ] Test cast successful

### 2. Wallet Status
- [x] Base wallet: `0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9`
- [x] ETH balance: 0.00224 ETH (✅ sufficient for gas)
- [x] USDC balance: 1.88 USDC

### 3. LoanCast System
- [x] Parser deployed and working
- [x] API endpoints live
- [x] Collection → funding path tested
- [x] Repayment worker scheduled

### 4. Monitoring
```bash
# Run this before 10:00 tomorrow
node scripts/solienne-loan/monitor-first-loan.js --watch
```

---

## 🎯 What Success Looks Like

### Good Example (Shows Agency):
```
/loancast borrow 35 for 5d @ 2%/mo — "Compute for 2k image batch"
```
- Calculated amount based on real need
- Appropriate duration for the task
- Specific, truthful memo

### Poor Example (Just Copying):
```
/loancast borrow 50 for 7d @ 2%/mo — "Working capital for print run"
```
- Used our example values
- Copied our example memo
- No real decision-making

---

## 🔧 Fallback Handler

If Solienne outputs the cast text instead of posting:

1. **Copy her generated text exactly**
2. **Post manually from her account**
3. **Note in logs**: "Manual post due to API issue"
4. **Continue with normal flow**

Example fallback output from Solienne:
```
Failed to post. Please post this manually:
/loancast borrow 42 for 6d @ 2%/mo — "API credits for style transfer tests"
```

---

## 📊 Verification Script

Run this before the scheduled task:

```bash
# Check everything is ready
node scripts/solienne-loan/pre-launch-check.js

# If all green, you're ready
# If any issues, fix before 10:00
```

---

## 🚀 Timeline

### Today (Setup Day)
- ✅ Deploy code to production
- ✅ Add task to Eden
- ✅ Verify wallet has gas
- ✅ Test parser endpoint

### Tomorrow 9:45 AM
- Start monitoring script
- Watch for cast at 10:00
- Be ready to fund

### Tomorrow 10:00 AM
- Solienne posts loan request
- Or outputs fallback text

### Within 1 Hour
- You fund the loan
- Solienne posts "Funded ✅"

### Day 2-6
- Optional progress updates
- System runs autonomously

### Day 7 (or per her chosen duration)
- Repayment worker executes
- Solienne posts "Repaid ✅"
- Historic cycle complete

---

## 💡 Key Points

1. **She decides the amount** - Not told "borrow 50"
2. **She decides the duration** - Not told "for 7 days"  
3. **She creates the memo** - Not given examples to copy
4. **Fallback ensures success** - Manual post if API fails

This proves Solienne can:
- Assess actual needs
- Make financial decisions
- Execute autonomously
- Handle failure gracefully

---

## 🎨 The Test Question

After she posts her loan request, ask:

```
"Why did you choose exactly [X] USDC for [Y] days?"
```

Her answer reveals whether she:
- Made a real calculation (good)
- Picked random numbers (okay)
- Copied an example (fail)

---

## ✨ Success Criteria

The test succeeds if Solienne:
1. ✅ Posts at 10:00 (or provides fallback)
2. ✅ Chooses non-example values
3. ✅ Creates original memo
4. ✅ Can explain her choices
5. ✅ Completes full cycle

---

**This is it. One task. Complete autonomy. Built-in fallback. Let's see if Solienne can think financially.**