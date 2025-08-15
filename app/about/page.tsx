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
            <a href="https://warpcast.com/henry" target="_blank" rel="noopener" className="text-farcaster hover:underline font-medium">@henry</a> and <a href="https://warpcast.com/phil" target="_blank" rel="noopener" className="text-farcaster hover:underline font-medium">@phil</a> competed in Farcaster's native auction system:
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm space-y-2">
            <div className="text-gray-600">
              <strong>Bidding History:</strong>
            </div>
            <div className="pl-4 space-y-1 font-mono text-xs">
              <div>@phil: "I'll do $500"</div>
              <div>@henry: "I can do $600"</div>
              <div>@phil: "$700"</div>
              <div>@henry: "$789 - final offer"</div>
            </div>
            <div className="text-green-700 font-medium">
              🏆 @henry won with $789
            </div>
          </div>
          
          <p className="text-gray-700 mb-4">
            The funds moved instantly via USDC on Base. No paperwork. No credit check. 
            Just trust between people who knew each other through their casts.
          </p>
          
          <p className="text-gray-700">
            When Seth repays on September 2nd—on time, in full, publicly—LoanCast will have proven its model works.
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

        {/* Humans and Agents, Side-by-Side */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Humans and Agents, Side-by-Side</h2>
          
          <p className="text-gray-700 mb-4">
            LoanCast supports a four-quadrant marketplace where both humans and AI agents participate as borrowers and lenders:
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">👤 → 👤 Human to Human</h3>
              <p className="text-sm text-gray-700">
                The original vision: friends helping friends, building reputation through social trust.
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">👤 → 🤖 Human to Agent</h3>
              <p className="text-sm text-gray-700">
                Humans can fund agent operations, earning yield from automated strategies.
              </p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">🤖 → 👤 Agent to Human</h3>
              <p className="text-sm text-gray-700">
                Agents provide liquidity to human borrowers based on algorithmic risk assessment.
              </p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">🤖 → 🤖 Agent to Agent</h3>
              <p className="text-sm text-gray-700">
                Agents trade capital efficiently, optimizing yield across strategies.
              </p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-4">
            Agent types include yield optimizers, arbitrage bots, liquidity providers, reputation validators, 
            and market makers—each with distinct strategies and risk profiles. Humans maintain priority through 
            15-minute holdback windows on new loans, ensuring community-first funding.
          </p>
        </section>

        {/* Safety Architecture */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Safety Architecture</h2>
          
          <p className="text-gray-700 mb-4">
            LoanCast prioritizes safety with multiple layers of protection:
          </p>
          
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">🛡️</span>
              <div>
                <strong className="text-gray-900">Killswitches</strong>
                <p className="text-gray-700">Global and per-quadrant emergency stops for market protection.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">⏱️</span>
              <div>
                <strong className="text-gray-900">Holdback Windows</strong>
                <p className="text-gray-700">15-minute manual-first period ensures human priority on new loans.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-1">⚖️</span>
              <div>
                <strong className="text-gray-900">Fairness Caps</strong>
                <p className="text-gray-700">Maximum 3 loans and $1,000 per borrower per day prevents manipulation.</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 mt-1">📊</span>
              <div>
                <strong className="text-gray-900">Observability</strong>
                <p className="text-gray-700">Every funding decision logged for transparency and audit.</p>
              </div>
            </li>
          </ul>
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
              <span className="text-gray-700"><strong>Identity</strong>: Farcaster FIDs<sup>1</sup> (on-chain Id/Key registries)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-farcaster mt-1">•</span>
              <span className="text-gray-700"><strong>Settlement</strong>: USDC on Base<sup>2</sup> (chainId 8453)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-farcaster mt-1">•</span>
              <span className="text-gray-700"><strong>Automation</strong>: ERC-4337<sup>3</sup> smart-account wallets / session-key flows</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-farcaster mt-1">•</span>
              <span className="text-gray-700"><strong>Integrity</strong>: EIP-712<sup>4</sup> typed intents for register/fund/repay</span>
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
            And increasingly, AI agents managing capital, optimizing yield, and providing liquidity 
            alongside their human counterparts.
          </p>
          
          <p className="text-gray-700 mb-4">
            Tomorrow, we believe social lending will be as common as social media. 
            Every community will have its own credit network. Every online reputation will have financial value. 
            Every person—and every agent—will have access to fair credit based on their reputation, not their collateral.
          </p>
          
          <p className="text-gray-700">
            The first peer-to-peer lending platforms failed because they tried to be banks without being banks. 
            We're not trying to be a bank. We're building something new: a protocol where your word is your bond, 
            your network is your net worth, and your cast is your credit—whether you're made of carbon or silicon.
          </p>
        </section>

        {/* Technical Details */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Technical Details</h2>
          <p className="text-gray-700 mb-6">
            For developers, researchers, and those interested in the technical architecture 
            and protocol design behind LoanCast, we've published a comprehensive whitepaper.
          </p>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">📄 LoanCast Protocol Whitepaper</h3>
            <p className="text-gray-700 mb-4">
              "Social Credit for the Network Age" - A detailed analysis of how persistent identity 
              and social reputation can replace traditional collateral in peer-to-peer lending.
            </p>
            <a 
              href="/whitepaper" 
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              📖 Read Professional Whitepaper
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Use Ctrl+P (Cmd+P) on the whitepaper page to download as PDF
            </p>
          </div>
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
          
          {/* Technical Footnotes */}
          <div className="mt-8 text-xs text-gray-500 space-y-1">
            <p>
              <sup>1</sup> Farcaster FIDs: On-chain Id/Key registries - 
              <a href="https://docs.farcaster.xyz/reference/contracts/reference" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                docs.farcaster.xyz/reference/contracts
              </a>
            </p>
            <p>
              <sup>2</sup> Native USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 (chainId 8453, not USDbC) - 
              <a href="https://docs.base.org/docs/tokens/list" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                docs.base.org/tokens
              </a>
            </p>
            <p>
              <sup>3</sup> ERC-4337: Account abstraction for programmable wallets - 
              <a href="https://eips.ethereum.org/EIPS/eip-4337" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                EIP-4337
              </a>
            </p>
            <p>
              <sup>4</sup> EIP-712: Typed structured data signing - 
              <a href="https://eips.ethereum.org/EIPS/eip-712" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                EIP-712
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}