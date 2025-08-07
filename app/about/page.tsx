import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">About LoanCast</h1>

        {/* The Genesis Cast */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">The Genesis Cast</h2>
          <p className="text-gray-700 mb-4">
            On August 4th, 2025, Seth posted a simple request on Farcaster:
          </p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 font-mono text-sm">
            <div className="text-gray-600">
              LOANCAST-001<br/>
              🏦 Borrow ≤ 1,000 USDC<br/>
              📅 30 days • due 2 Sep 2025<br/>
              📈 Yield 2% → repay 1.02x<br/>
              🎯 Highest bid = lender<br/>
              💰 I eat Farcaster's 10%<br/>
              ⚠️ This cast *is* the note
            </div>
          </div>

          <p className="text-gray-700 mb-4">
            What happened next proved something powerful: social capital can be financial capital.
          </p>
          
          <p className="text-gray-700 mb-4">
            Henry and Phil competed in Farcaster's native auction system. Henry won with a $789 bid. 
            The funds moved instantly via USDC on Base. No paperwork. No credit check. 
            Just trust between people who knew each other through their casts.
          </p>
          
          <p className="text-gray-700">
            When Seth repaid on September 2nd—on time, in full, publicly—LoanCast was born.
          </p>
        </section>

        {/* Why We Built This */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Why We Built This</h2>
          <p className="text-gray-700 mb-4">
            Traditional credit is theater. Three-digit scores from faceless bureaus. 
            Collateral requirements that exclude anyone who actually needs money. 
            Interest rates that punish the vulnerable.
          </p>
          
          <p className="text-gray-700 mb-4">
            Meanwhile, we already lend to friends. We Venmo rent money, spot each other for emergencies, 
            help out when someone's between paychecks. But these acts of trust build no credit history. 
            Your perfect repayment to a friend means nothing to a bank.
          </p>
          
          <p className="text-gray-700 font-medium">
            LoanCast changes that. Every loan is public. Every repayment builds reputation. 
            Every default has social consequences. Your cast becomes your credit history.
          </p>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">How It Works</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">For Borrowers</h3>
              <p className="text-gray-700">
                Post your loan request as a Farcaster collectible. Your followers see it in their feed. 
                Set your terms—amount (up to $1,000), duration, and interest rate. 
                The highest bidder funds your loan.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">For Lenders</h3>
              <p className="text-gray-700">
                See loan requests from people you follow. Check their reputation, mutual connections, 
                and history. Fund with one click using USDC on Base. Earn yield while helping your network.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">For Everyone</h3>
              <p className="text-gray-700">
                Build portable reputation. Your LoanCast score travels with you across Web3. 
                Good repayment history unlocks better terms. Social capital becomes financial capital.
              </p>
            </div>
          </div>
        </section>

        {/* The Technology */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">The Technology</h2>
          <p className="text-gray-700 mb-4">
            LoanCast runs entirely on public infrastructure:
          </p>
          
          <ul className="space-y-2 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-farcaster mt-1">•</span>
              <span className="text-gray-700"><strong>Identity</strong>: Farcaster provides persistent social identity</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-farcaster mt-1">•</span>
              <span className="text-gray-700"><strong>Payments</strong>: USDC on Base enables instant, global settlement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-farcaster mt-1">•</span>
              <span className="text-gray-700"><strong>Distribution</strong>: Loan requests appear natively in social feeds</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-farcaster mt-1">•</span>
              <span className="text-gray-700"><strong>Reputation</strong>: On-chain history that can't be hidden or erased</span>
            </li>
          </ul>
          
          <p className="text-gray-700">
            No custody. No intermediation. Just peer-to-peer lending with social reputation as collateral.
          </p>
        </section>

        {/* Our Principles */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Our Principles</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Transparency</h3>
              <p className="text-gray-700">
                Every loan, bid, and repayment is public. Reputation requires radical transparency.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Simplicity</h3>
              <p className="text-gray-700">
                If it takes more than one cast to borrow or one click to lend, we've failed.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Community</h3>
              <p className="text-gray-700">
                The network gets stronger with every successful loan. 
                We're building shared infrastructure for social credit.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Access</h3>
              <p className="text-gray-700">
                No credit scores. No documentation. If you have reputation in the network, 
                you have access to credit.
              </p>
            </div>
          </div>
        </section>

        {/* The Vision */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">The Vision</h2>
          <p className="text-gray-700 mb-4">
            Today, LoanCast serves the Farcaster community—developers needing conference tickets, 
            creators buying equipment, friends helping friends through temporary crunches.
          </p>
          
          <p className="text-gray-700 mb-4">
            Tomorrow, we believe social lending will be as common as social media. 
            Every community will have its own credit network. Every online reputation will have financial value. 
            Every person will have access to fair credit based on their social capital, not their paper wealth.
          </p>
          
          <p className="text-gray-700">
            The first peer-to-peer lending platforms failed because they tried to be banks without being banks. 
            We're not trying to be a bank. We're building something new: a protocol where your word is your bond, 
            your network is your net worth, and your cast is your credit.
          </p>
        </section>

        {/* Join Us */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Join Us</h2>
          <p className="text-gray-700 mb-6">
            LoanCast is open to everyone on Farcaster. Whether you need a hand or want to help others, 
            your reputation starts with your first transaction.
          </p>
          
          <p className="text-gray-700 mb-8">
            Ready to transform your social capital into financial capital?
          </p>
          
          <Link 
            href="/loans/new"
            className="inline-block bg-farcaster text-white px-8 py-3 rounded-lg font-semibold hover:bg-farcaster-dark transition"
          >
            Cast your first loan →
          </Link>
        </section>

        {/* Footer note */}
        <div className="border-t pt-8 mt-12">
          <p className="text-sm text-gray-600 italic">
            Built by the Farcaster community, for the Farcaster community. 
            LoanCast is a public good that transforms social trust into financial access.
          </p>
        </div>
      </div>
    </div>
  )
}