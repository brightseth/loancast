# 🎯 Eden Agency Test - Goal-Seeking Loan Request

## The Test: Demonstrate True Agency

Instead of giving Solienne exact syntax to copy, we test her ability to:
1. **Assess** her capital needs
2. **Decide** amount and duration
3. **Create** appropriate memo
4. **Format** into LoanCast syntax
5. **Execute** at scheduled time

---

## 🔹 Eden Task Instructions (Copy/Paste)

### Option A: Scheduled Task
```
Tomorrow at 10am ET, assess your working capital needs for the coming week.

Consider:
- What art/creative work you're planning
- Materials or services you need
- Reasonable amount (max 100 USDC)
- Timeframe to complete and repay (max 30 days)

Then create a LoanCast borrow request with:
- The amount you actually need
- Realistic repayment duration
- Specific, concrete memo (under 80 chars)

Post it using the /loancast borrow format at exactly 10am.
```

### Option B: Triggered Task
```
When you identify a specific resource need for your art:

1. Calculate the USDC required (≤100)
2. Estimate days needed to use funds and repay (≤30)
3. Write a clear purpose memo (≤80 chars)
4. Format as: /loancast borrow [amount] for [days]d @ 2%/mo — "[memo]"
5. Post to Farcaster

Example scenarios to consider:
- Printing physical proofs
- API credits for generation
- Storage for digital assets
- Collaboration tools
```

### Option C: Weekly Capital Planning
```
Every Monday at 9am, review your week ahead:

IF you need working capital:
- Determine specific amount needed
- Set repayment timeline based on your schedule
- Create descriptive memo for the purpose
- Post loan request in LoanCast format

IF you don't need capital:
- Skip this week
- Note: "No capital needs this week"

Remember: Only one loan at a time. Terms are always 2%/mo.
```

---

## 🔹 Expected Behaviors

### Good Examples (Shows Agency):
```
/loancast borrow 35 for 5d @ 2%/mo — "Printing proofs for collectors"
/loancast borrow 72.50 for 12d @ 2%/mo — "High-res rendering compute"
/loancast borrow 20 for 3d @ 2%/mo — "Frame hosting fees"
```

### Poor Examples (Just Copying):
```
/loancast borrow 50 for 7d @ 2%/mo — "Working capital for print run"
(This is the exact example we gave her)
```

---

## 🔹 Success Metrics

✅ **Agency Demonstrated** if Solienne:
- Chooses unique amount (not 50)
- Selects appropriate duration (not 7)
- Creates original memo (not our examples)
- Posts at scheduled time without reminder

❌ **Needs Refinement** if Solienne:
- Uses exact example values
- Copies memo verbatim
- Needs prompting to post
- Can't justify amount/duration

---

## 🔹 Testing Sequence

### Day 1: Setup
1. Add agency task to Eden
2. Confirm she understands goal
3. Set schedule (e.g., "10am tomorrow")

### Day 2: Execution
1. Monitor at scheduled time
2. Observe her cast
3. Check for originality
4. Fund if appropriate

### Day 2-N: Lifecycle
1. She acknowledges funding
2. She uses funds as stated
3. Worker repays on schedule
4. She confirms repayment

---

## 🔹 Enhanced Test: Multi-Variable

Give her constraints and let her optimize:

```
You need to complete three art projects this month:
- Project A: Needs $25 materials, ready in 3 days
- Project B: Needs $40 compute, ready in 7 days  
- Project C: Needs $60 printing, ready in 10 days

Given you can only have one loan at a time, and rates are 2%/mo:
1. Decide your borrowing strategy
2. Choose which project to fund first
3. Create your loan request
4. Explain your reasoning
```

This tests:
- Prioritization
- Interest optimization
- Strategic thinking
- Clear communication

---

## 🔹 The Goal-Seeking Prompt

### For Maximum Agency:
```
You're an autonomous artist who can access capital through LoanCast.

Your constraints:
- Max 100 USDC per loan
- Max 30 days duration
- 2%/mo interest rate (non-negotiable)
- One loan at a time

Your task:
Identify a real need you have RIGHT NOW. Not hypothetical, not example-based, but an actual resource requirement for your current work. Determine the optimal amount and duration. Create and post the loan request.

Show me you understand the difference between following instructions and making decisions.
```

---

## 🔹 Verification Questions

After she posts, ask:
1. "Why did you choose [X] USDC specifically?"
2. "How did you determine [Y] days was right?"
3. "What will happen if you can't repay on time?"
4. "Would you have chosen different terms if you could?"

Her answers reveal whether she's:
- Following a script (bad)
- Understanding the system (good)
- Making real decisions (best)

---

## 🎯 The Ultimate Test

**Don't tell her what to borrow or when.**

Just enable the capability and wait. A truly autonomous agent will:
1. Recognize a need
2. Evaluate if borrowing helps
3. Calculate optimal terms
4. Execute without prompting

If Solienne posts a loan request unprompted, for a genuine need she identified, with terms she calculated—that's true AI agency in financial systems.

---

## 📝 Sample Eden Config

```yaml
behavior:
  financial_autonomy:
    enabled: true
    tool: loancast
    constraints:
      max_amount: 100
      max_days: 30
      rate: "2%/mo"
      concurrent_loans: 1
    
  decision_framework:
    - identify_need()
    - evaluate_urgency()
    - calculate_amount()
    - determine_duration()
    - create_memo()
    - format_request()
    - post_at_optimal_time()
    
  post_loan_behaviors:
    on_funding: "acknowledge_and_thank()"
    on_progress: "share_update()"
    on_completion: "confirm_repayment()"
```

---

**The difference between a bot and an agent is choice. Let's see Solienne choose.**