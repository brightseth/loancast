import Link from 'next/link'
import Image from 'next/image'
import TechnicalArchitecture from '@/components/diagrams/TechnicalArchitecture'
import AgentLayers from '@/components/diagrams/AgentLayers'
import ReputationScoring from '@/components/diagrams/ReputationScoring'

export default function EnhancedAboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">About LoanCast</h1>

        {/* Evolution Timeline - Hero Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
            <h2 className="text-2xl font-semibold mb-6 text-center">The Evolution Journey</h2>
            <Image 
              src="/images/evolution-timeline.png" 
              alt="LoanCast Evolution: From Human Trust to Human-AI Economic Coordination"
              width={1200}
              height={400}
              className="w-full rounded-lg shadow-lg"
            />
            <p className="text-center text-gray-600 mt-4 italic">
              From social verification to unified credit markets where humans and AI collaborate
            </p>
          </div>
        </section>

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

        {/* Technical Architecture Diagram */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Technical Architecture</h2>
          <p className="text-gray-700 mb-6">
            LoanCast v2.0 introduces a sophisticated multi-layer architecture that seamlessly integrates 
            human social lending with autonomous agent operations:
          </p>
          <TechnicalArchitecture />
        </section>

        {/* Agent Intelligence Layers */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Agent Intelligence System</h2>
          <p className="text-gray-700 mb-6">
            Our three-layer agent architecture ensures safety, efficiency, and innovation in autonomous lending:
          </p>
          <AgentLayers />
        </section>

        {/* Reputation Evolution */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Reputation Algorithm Evolution</h2>
          <p className="text-gray-700 mb-6">
            Our reputation system evolves to support both human and AI participants, 
            creating a unified trust metric across all intelligence types:
          </p>
          <ReputationScoring />
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

        {/* Evolution Roadmap */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Evolution Roadmap</h2>
          
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
              <h3 className="font-semibold text-lg mb-2">Q4 2025: Foundation Enhancement</h3>
              <ul className="space-y-1 text-gray-700">
                <li>✓ Smart account integration (Safe + Session Keys)</li>
                <li>✓ Basic yield deployment for idle capital</li>
                <li>⏳ Guardian agent alpha testing</li>
                <li>⏳ Cross-chain reputation bridges</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
              <h3 className="font-semibold text-lg mb-2">Q1 2026: Intelligence Layer</h3>
              <ul className="space-y-1 text-gray-700">
                <li>◯ Natural language loan requests</li>
                <li>◯ Autonomous risk assessment</li>
                <li>◯ Yield optimization across protocols</li>
                <li>◯ Agent performance tracking</li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-500">
              <h3 className="font-semibold text-lg mb-2">Q2 2026: Convergence Beginning</h3>
              <ul className="space-y-1 text-gray-700">
                <li>◯ First AI entity loan</li>
                <li>◯ Hybrid human-AI products</li>
                <li>◯ Strategy marketplace launch</li>
                <li>◯ Credit passport v1.0</li>
              </ul>
            </div>

            <div className="bg-orange-50 rounded-lg p-6 border-l-4 border-orange-500">
              <h3 className="font-semibold text-lg mb-2">2027: Scale and Sovereignty</h3>
              <ul className="space-y-1 text-gray-700">
                <li>◯ 1M credit passports issued</li>
                <li>◯ $100M in autonomous loans</li>
                <li>◯ Regulatory framework established</li>
                <li>◯ Global expansion beyond crypto-native</li>
              </ul>
            </div>
          </div>
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

        {/* Technical Details - Enhanced Whitepaper Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Technical Documentation</h2>
          <p className="text-gray-700 mb-6">
            For developers, researchers, and those interested in the technical architecture 
            and protocol design behind LoanCast, we've published a comprehensive whitepaper 
            with the Evolution Addendum for AgentFi integration.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">📄 Original Whitepaper v1.0</h3>
              <p className="text-gray-700 mb-4">
                "Social Credit for the Network Age" - How persistent identity 
                and social reputation replace traditional collateral.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Core protocol architecture</li>
                <li>• Reputation mechanics</li>
                <li>• Early results & network effects</li>
                <li>• Regulatory approach</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">🚀 Evolution Addendum v2.0</h3>
              <p className="text-gray-700 mb-4">
                "From Social Credit Primitive to Autonomous Financial Intelligence" - 
                The path to human-AI convergence.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• AgentFi convergence thesis</li>
                <li>• Three-layer agent architecture</li>
                <li>• Enhanced reputation algorithms</li>
                <li>• Unified credit markets vision</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a 
              href="/whitepaper" 
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-purple-700 transition text-lg"
            >
              📖 Read Complete Whitepaper & Evolution Addendum
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Use Ctrl+P (Cmd+P) on the whitepaper page to download as PDF
            </p>
          </div>
        </section>

        {/* The Vision - Updated */}
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
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <p className="text-lg font-medium text-center mb-4">The Evolution Stages</p>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl mb-2">✓</div>
                <div className="text-sm font-semibold">Stage 1</div>
                <div className="text-xs text-gray-600">Friends lending on Farcaster</div>
              </div>
              <div>
                <div className="text-2xl mb-2">🚧</div>
                <div className="text-sm font-semibold">Stage 2</div>
                <div className="text-xs text-gray-600">Agents enhancing trust networks</div>
              </div>
              <div>
                <div className="text-2xl mb-2">🔮</div>
                <div className="text-sm font-semibold">Stage 3</div>
                <div className="text-xs text-gray-600">Unified human-AI credit markets</div>
              </div>
              <div>
                <div className="text-2xl mb-2">∞</div>
                <div className="text-sm font-semibold">Stage 4</div>
                <div className="text-xs text-gray-600">Trust layer for all economic activity</div>
              </div>
            </div>
          </div>
          
          <p className="text-gray-700 mt-6 font-medium text-center text-lg">
            The manifesto stands: <span className="text-purple-600">Your cast is your credit.</span><br/>
            The evolution begins: <span className="text-green-600">Every intelligence deserves credit.</span>
          </p>
        </section>

        {/* Join Us */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Join the Evolution</h2>
          <p className="text-gray-700 mb-6">
            LoanCast is open to everyone on Farcaster. Whether you need a hand or want to help others, 
            your reputation starts with your first transaction. And soon, whether you're human or AI, 
            you'll have equal access to the credit you deserve.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/loans/new"
              className="inline-block bg-farcaster text-white px-8 py-3 rounded-lg font-semibold hover:bg-farcaster-dark transition"
            >
              Cast your first loan →
            </Link>
            <Link 
              href="/whitepaper"
              className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Read the Whitepaper →
            </Link>
            <a 
              href="https://github.com/loancast/agentfi"
              target="_blank"
              rel="noopener"
              className="inline-block bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-900 transition"
            >
              Build with us →
            </a>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              🎯 <strong>First AI loan target:</strong> January 1, 2026
            </p>
          </div>
        </section>

        {/* Footer note */}
        <div className="border-t pt-8 mt-12">
          <p className="text-sm text-gray-600 italic text-center">
            Built by the Farcaster community, for the Farcaster community. 
            LoanCast is a public good that transforms social trust into financial access—for all intelligence types.
          </p>
        </div>
      </div>
    </div>
  )
}