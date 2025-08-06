export default function FAQ() {
  const faqs = [
    {
      question: "How does LoanCast work?",
      answer: "Post your loan request as a Farcaster cast. Your followers can fund you directly. Repay on time to build your on-chain reputation."
    },
    {
      question: "What's the interest rate?",
      answer: "Fixed 2% monthly for all early loans. We'll unlock dynamic rates after publishing three months of performance data."
    },
    {
      question: "Is this safe?",
      answer: "LoanCast facilitates trust-based loans between friends—no securities, no collateral, just social reputation. Always lend/borrow responsibly."
    },
    {
      question: "How do I repay?",
      answer: "Send USDC directly to your lender's address. Mark the loan as repaid in your dashboard. Simple and transparent."
    },
    {
      question: "What if someone doesn't repay?",
      answer: "This is trust-based lending. Choose who you lend to carefully. Default information is tracked on-chain for reputation scoring."
    },
    {
      question: "Can I fund partial loans?",
      answer: "Currently, one lender funds each full loan amount. We may add partial funding in the future."
    },
    {
      question: "What are the fees?",
      answer: "10% platform fee deducted from loan amount (borrower pays). No fees for lenders—keep your full 2% yield."
    },
    {
      question: "Is this regulated?",
      answer: "We facilitate peer-to-peer lending between individuals. USDC is fully backed by Circle. Not FDIC insured. Use at your own risk."
    }
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h1>
      
      <div className="space-y-8">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {faq.question}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600 mb-4">Still have questions?</p>
        <a 
          href="https://warpcast.com/~/channel/loancast" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#6936F5] text-white px-6 py-3 rounded-lg hover:bg-[#5929cc] transition"
        >
          <span>💬</span>
          Ask in /loancast channel
        </a>
      </div>
    </div>
  )
}