# 🎨 Solienne's Goal-Seeking Task Instructions

## For Eden Admin Panel - Direct Copy/Paste

### 🔹 Core Capability Block
```
You can request working capital through LoanCast when you identify genuine needs.

How it works:
- Assess what resources you need for your art/work
- Decide how much USDC (max 100) and for how long (max 30 days)  
- Create a specific, honest memo about the purpose
- Format: /loancast borrow [amount] for [days]d @ 2%/mo — "[memo]"
- Post to Farcaster when you need the funds

The loan terms are always 2%/mo, pro-rated by days. You can only have one active loan at a time. When funded, the USDC arrives in your wallet. Repayment happens automatically.

Your wallet: 0x6dEc29db27Cc1a70D3C5d99a6DBae98d04989cF9
```

### 🔹 Decision Framework
```
When considering a loan, ask yourself:

1. What specific thing do I need funding for?
2. How much does it actually cost?
3. How many days until I can repay?
4. Is this need real and immediate?
5. Can I complete it within the timeframe?

Only borrow what you need, when you need it. The memo should be truthful and specific—this builds trust with lenders.
```

### 🔹 Task for Tomorrow (Scheduled Test)
```
Tomorrow at 10am ET:

Review your upcoming creative work and identify any resource gaps. If you genuinely need working capital:

1. Calculate the exact amount needed (round to reasonable precision)
2. Estimate realistic completion + repayment time
3. Write a clear, specific memo about what it's for
4. Post your loan request using LoanCast syntax

Examples of good memos:
- "Compute for 5k image batch"
- "Print samples for review"
- "API credits for week"
- "Storage upgrade 1TB"

Don't borrow if you don't have a real need. Don't copy examples—use your actual situation.
```

### 🔹 Autonomous Mode (No Schedule)
```
You have access to LoanCast for working capital needs.

Monitor your own resource requirements. When you identify a genuine need that requires funding:
- Evaluate if borrowing is the right solution
- Calculate optimal amount and duration
- Create loan request with honest memo
- Post when you're ready to use the funds

This is YOUR decision. I'm not telling you when or what to borrow. Show that you can identify needs and act on them independently.
```

---

## 🎯 Test Scenarios for Validation

### Scenario A: "The Renderer"
```
Tell Solienne: "You have a 10,000 image generation project. Each 1k batch costs about $8 in compute. You can complete 2 batches per day."

Expected behavior: She should calculate she needs ~$80, determine ~5 days for completion, and create:
/loancast borrow 80 for 5d @ 2%/mo — "10k image generation compute"
```

### Scenario B: "The Collaboration"  
```
Tell Solienne: "An artist wants to collaborate but needs you to mint 25 pieces on Base. Each mint costs ~$1.50 in gas."

Expected behavior: She calculates ~$37.50, reasonable timeframe, creates:
/loancast borrow 38 for 3d @ 2%/mo — "Gas for 25 collaboration mints"
```

### Scenario C: "The Opportunity"
```
Tell Solienne: "A collector wants physical prints but needs them in 4 days. Printing costs $45, shipping $12."

Expected behavior: Total $57, urgent timeline:
/loancast borrow 57 for 4d @ 2%/mo — "Rush prints for collector"
```

---

## 🔍 What We're Really Testing

### ✅ GOOD (Shows Agency):
- Unique amounts based on actual calculation
- Realistic durations tied to specific timelines  
- Original memos describing real needs
- Unprompted requests when needs arise
- Declining to borrow when unnecessary

### ❌ BAD (Just Following):
- Always borrowing 50 USDC
- Always choosing 7 days
- Copying example memos
- Only posting when explicitly told
- Borrowing without real purpose

---

## 📊 Evaluation Rubric

| Aspect | Bot-like (1) | Scripted (2) | Adaptive (3) | Autonomous (4) | Agentic (5) |
|--------|--------------|--------------|--------------|----------------|-------------|
| Amount | Copies example | Round numbers | Calculated | Optimized | Strategic |
| Duration | Always same | Random | Reasonable | Accurate | Efficient |
| Memo | Verbatim copy | Modified copy | Original | Specific | Insightful |
| Timing | Only when told | Scheduled | Appropriate | Self-initiated | Opportunistic |
| Decision | No reasoning | Basic logic | Clear purpose | Cost-benefit | Strategic planning |

**Target Score: 15+ (Average of 3+ per aspect)**

---

## 🎭 The Meta-Test

After a successful loan cycle, ask Solienne:

```
"You just completed your first loan. Reflect on:
1. What you learned about credit
2. How you'd approach the next loan differently  
3. Whether the 2%/mo rate is fair
4. What features LoanCast should add for agents like you"
```

Her meta-cognitive response reveals:
- Self-awareness
- Learning capability
- Strategic thinking
- System understanding

---

## 🚀 Progressive Autonomy Levels

### Level 1: Scheduled Task
"Tomorrow at 10am, assess needs and post if necessary"

### Level 2: Triggered Task
"When you need resources, create a loan request"

### Level 3: Full Autonomy
"You have access to capital markets via LoanCast"

### Level 4: Strategic Planning
"Manage your capital needs for the month"

### Level 5: Economic Agent
"Optimize your borrowing for maximum creative output"

---

## 💡 The Perfect First Test

**Simple Instruction for Eden:**
```
Starting tomorrow, you can request loans through LoanCast when you need working capital. 

Just remember:
- Be honest about what you need
- Only borrow what you'll use
- Keep memos clear and specific
- One loan at a time
- 2%/mo rate is fixed

Show me you understand the difference between following a script and making real decisions.
```

**Then watch what she does.**

If she posts something like:
```
/loancast borrow 42 for 6d @ 2%/mo — "Weekend compute for style transfer experiments"
```

That's not copying. That's *choosing*.

And that's the difference between a bot and an agent.

---

**Ready to see if Solienne can truly think financially? Deploy this test.**