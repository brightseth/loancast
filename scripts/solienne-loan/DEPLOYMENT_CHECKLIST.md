# 🚀 Solienne LoanCast Deployment Checklist

## ✅ Completed
- [x] Database migrations applied
- [x] Agent tables created
- [x] Solienne registered (FID: 1113468)
- [x] Parser implemented and tested
- [x] API endpoints created
- [x] Repayment worker built
- [x] Eden training docs prepared
- [x] Solienne has gas ($10 ETH)

## 📋 Deploy Today

### 1. Deploy API Endpoints (30 min)
```bash
# Deploy to Vercel
git add .
git commit -m "Add Solienne LoanCast integration"
git push origin main

# Vercel auto-deploys from main branch
```

### 2. Set Environment Variable
Add to Vercel dashboard:
```
SOLIENNE_PRIVATE_KEY=<key>  # For repayment worker
CRON_SECRET=<secret>        # For cron security
```

### 3. Verify Endpoints
```bash
# Test parse endpoint
curl -X POST https://loancast.app/api/loancast/parse \
  -H "Content-Type: application/json" \
  -d '{
    "text": "/loancast borrow 50 for 7d @ 2%/mo — \"Test\"",
    "fid": 1113468
  }'
```

### 4. Add to Eden Admin Panel
Copy from `EDEN_INTEGRATION.md`:
- Core behavior block
- Cast templates
- Decision logic

## 🎯 Launch Day

### Morning
- [ ] Solienne posts first cast
- [ ] Verify loan created in DB
- [ ] Share cast for visibility

### When Collected
- [ ] Verify USDC arrives
- [ ] Check loan status → funded
- [ ] Solienne posts "Funded ✅"

### Day 3-4
- [ ] Solienne posts progress update
- [ ] Check worker logs

### Day 7
- [ ] Worker executes repayment
- [ ] Verify on BaseScan
- [ ] Solienne posts "Repaid ✅"
- [ ] Announce historic moment

## 📊 Monitoring

### Database Query
```sql
-- Check Solienne's loans
SELECT * FROM loans 
WHERE borrower_fid = 1113468
ORDER BY created_at DESC;

-- Check repayment status
SELECT id, status, gross_usdc, repay_usdc, due_ts, tx_repay
FROM loans
WHERE borrower_fid = 1113468
AND status = 'funded';
```

### Worker Logs
```bash
# Check Vercel function logs
vercel logs --function api/cron/solienne-repay

# Or check local test
node scripts/solienne-loan/solienne-repay-worker-2pct.js --test
```

## 🚨 Troubleshooting

### If cast doesn't parse:
1. Check exact syntax match
2. Verify FID is 1113468
3. Check for existing active loans

### If collection doesn't fund:
1. Check funding_intents table
2. Verify lender has USDC
3. Check gas for transaction

### If repayment fails:
1. Check Solienne has USDC
2. Verify gas balance
3. Check worker logs
4. Manually trigger if needed

## 🎉 Success Criteria

Week 1:
- [ ] First loan cycle complete
- [ ] 100% syntax accuracy
- [ ] On-time repayment

Week 2:
- [ ] 3+ loans completed
- [ ] Multiple lenders
- [ ] 100% repayment rate

Month 1:
- [ ] 10+ loans
- [ ] <6hr funding time
- [ ] Credit score increase

## 📝 First Cast Template

```
/loancast borrow 50 for 7d @ 2%/mo — "Working capital for Solienne print run"

(Collector funds my wallet. Principal + 2%/mo, pro-rated by days.)
```

## 🔗 Important Links

- LoanCast: https://loancast.app
- Solienne Profile: https://loancast.app/p/1113468
- Eden Admin: [Add behavior blocks here]
- BaseScan: https://basescan.org
- Wallet: 0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9

---

**Ready to make history! 🚀**