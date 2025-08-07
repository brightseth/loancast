export default function WhitepaperPage() {
  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none; }
          .print-break { page-break-before: always; }
          body { font-size: 12pt; line-height: 1.4; }
          h1 { font-size: 24pt; }
          h2 { font-size: 18pt; }
          h3 { font-size: 14pt; }
        }
      `}</style>
      
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            LoanCast Protocol
          </h1>
          <h2 className="text-xl md:text-2xl font-light mb-6">
            The Social Credit Primitive
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Version 1.0</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>August 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>loancast.app</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        
        {/* Manifesto */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-8 rounded-lg border-l-4 border-purple-500">
            <h2 className="text-2xl font-bold mb-6 text-purple-900">Manifesto :: Your Cast is Your Credit</h2>
            <div className="space-y-4 text-lg leading-relaxed text-gray-700">
              <p>
                <strong>Social capital is real capital.</strong> In a world where identity persists and communities witness, reputation becomes the only collateral that matters.
              </p>
              <p>
                Traditional credit failed—three numbers from faceless bureaus gate access to capital. Web2 peer-to-peer failed—anonymous defaults and institutional capture killed the dream. They tried to port old systems to new rails.
              </p>
              <p>
                <strong>LoanCast isn't porting anything.</strong> We're building credit native to social networks. Where a cast is a contract. Where your followers are your credit union. Where defaulting costs more than money—it costs identity.
              </p>
              <p className="text-purple-800 font-semibold">
                The cryptoeconomy needs credit expansion. Not through collateral—that's just moving existing capital. Through reputation—that creates new capital from social trust.
              </p>
            </div>
          </div>
        </section>

        {/* Section 1 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 border-b-2 border-purple-200 pb-4">
            The Social Credit Gap
          </h2>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              The modern financial system runs on two pillars: money and credit. Crypto solved money with stablecoins. Credit remains broken.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h4 className="font-bold mb-4">The numbers tell the story:</h4>
              <ul className="space-y-2">
                <li>• $5.3 trillion in global unsecured credit</li>
                <li>• $100 billion in rotating savings groups (ROSCAs)</li>
                <li>• $1.3 trillion in cash-flow based financing</li>
                <li><strong>• $0 in social network native credit</strong></li>
              </ul>
            </div>
            
            <p>
              Every day, millions lend to friends on Venmo, Zelle, CashApp. No history built. No reputation earned. No access unlocked. These trust-based transactions remain invisible to the financial system, creating no value for participants beyond the immediate exchange.
            </p>
            
            <p>
              Meanwhile, 2 billion people globally are "credit invisible"—they have smartphones, social networks, and financial needs, but no access to fair credit. The infrastructure for trust exists. The rails for value transfer exist. Only the protocol to connect them is missing.
            </p>
            
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <p className="font-semibold text-purple-900 text-xl text-center">
                <strong>LoanCast is that protocol.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 border-b-2 border-purple-200 pb-4">
            The Credit Primitive
          </h2>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              LoanCast transforms Farcaster's social graph into a credit network through three innovations:
            </p>
            
            <div className="space-y-8">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-purple-900">1. Cast-as-Contract Architecture</h3>
                <p className="mb-4">The loan request <em>is</em> the loan contract. By leveraging Farcaster's native collectible mechanism:</p>
                <ul className="space-y-2 ml-4">
                  <li><strong>Price Discovery:</strong> 24-hour auctions naturally price credit risk</li>
                  <li><strong>Social Proof:</strong> Public casts create community accountability</li>
                  <li><strong>Atomic Settlement:</strong> Smart contracts handle the entire flow</li>
                  <li><strong>Viral Distribution:</strong> Loans appear natively in social feeds</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-purple-900">2. Reputation-as-Collateral Model</h3>
                <p className="mb-4">When identity persists and communities witness, social capital becomes effective collateral:</p>
                <ul className="space-y-2 ml-4">
                  <li><strong>Identity Value:</strong> Farcaster IDs with history are socially expensive to abandon</li>
                  <li><strong>Network Effects:</strong> Each successful repayment strengthens the entire system</li>
                  <li><strong>Social Enforcement:</strong> Default consequences are immediate and public</li>
                  <li><strong>Portable Credit:</strong> Reputation travels across the decentralized web</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-purple-900">3. Protocol-First Design</h3>
                <p className="mb-4">LoanCast operates as infrastructure, not an application:</p>
                <ul className="space-y-2 ml-4">
                  <li><strong>No Custody:</strong> Protocol never holds funds</li>
                  <li><strong>No Pooling:</strong> Direct peer-to-peer transactions avoid securities complications</li>
                  <li><strong>No Gatekeeping:</strong> Anyone can build interfaces and integrations</li>
                  <li><strong>No Rent-Seeking:</strong> After covering Farcaster fees, protocol remains free</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 border-b-2 border-purple-200 pb-4">
            The Credit Stack
          </h2>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4">Layer 0: Identity Infrastructure</h4>
                <ul className="space-y-2 text-sm">
                  <li><strong>Farcaster IDs (FIDs):</strong> Cryptographically-controlled persistent identity</li>
                  <li><strong>Social Graph:</strong> Followers, connections, and interaction history</li>
                  <li><strong>ENS Integration:</strong> Optional real-name attestation</li>
                  <li><strong>Cross-Protocol Future:</strong> Lens, WorldID, and emerging identity systems</li>
                </ul>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4">Layer 2: Application Layer</h4>
                <ul className="space-y-2 text-sm">
                  <li><strong>LoanCast.app:</strong> Reference implementation</li>
                  <li><strong>Mobile Apps:</strong> Native iOS/Android experiences</li>
                  <li><strong>DAO Integrations:</strong> Treasury management tools</li>
                  <li><strong>Creator Tools:</strong> Advance against future content</li>
                  <li><strong>API/SDK:</strong> Enable any developer to build</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h4 className="font-bold text-lg mb-4">Layer 1: Core Protocol</h4>
              <div className="bg-gray-800 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
                <div>LoanCore.sol</div>
                <div className="ml-4">├── createLoan(fid, amount, duration, rate)</div>
                <div className="ml-4">├── fundLoan(loanId, lenderFid)</div>
                <div className="ml-4">├── repayLoan(loanId)</div>
                <div className="ml-4">└── updateReputation(fid, outcome)</div>
                <div className="mt-2">ReputationOracle.sol</div>
                <div className="ml-4">├── computeScore(fid) → 0-1000</div>
                <div className="ml-4">├── assignBadge(fid, BadgeType)</div>
                <div className="ml-4">└── getMaxLoan(score) → amount</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 border-b-2 border-purple-200 pb-4">
            Credit Mechanics
          </h2>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h4 className="font-bold text-lg mb-4">Reputation Algorithm</h4>
              <div className="bg-gray-800 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto mb-4">
                <div>Score = 400 * sqrt(followers/1000) +</div>
                <div className="ml-8">400 * (successful_loans/total_loans) +</div>
                <div className="ml-8">200 * (account_age_days/365)</div>
                <div className="mt-2">Constraints:</div>
                <div className="ml-4">- New accounts: Start at 200 (social proof baseline)</div>
                <div className="ml-4">- First loan: Capped at $200</div>
                <div className="ml-4">- Growth path: Each repayment unlocks higher limits</div>
                <div className="ml-4">- Default penalty: -200 points + permanent badge</div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4">Interest Rate Discovery</h4>
                <p className="mb-4">Market-driven through auction mechanics:</p>
                <ul className="space-y-2 text-sm">
                  <li><strong>High reputation + urgent need:</strong> 0-2% monthly</li>
                  <li><strong>Medium reputation + standard need:</strong> 2-5% monthly</li>
                  <li><strong>Low reputation or first loan:</strong> 5-10% monthly</li>
                  <li><strong>Natural ceiling:</strong> Social judgment prevents predatory rates</li>
                </ul>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4">Risk Distribution</h4>
                <ul className="space-y-2 text-sm">
                  <li><strong>Small loans:</strong> Median $500 limits individual exposure</li>
                  <li><strong>Multiple lenders:</strong> Auction allows partial funding</li>
                  <li><strong>Social filtering:</strong> Loans visible primarily to existing network</li>
                  <li><strong>Reputation stakes:</strong> Borrowers risk years of social capital</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 border-b-2 border-purple-200 pb-4">
            Network Effects and Growth
          </h2>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-bold text-lg mb-4 text-blue-800">The Virtuous Cycle</h4>
              <ol className="space-y-2 text-blue-700">
                <li>1. <strong>Successful loan</strong> → Builds borrower reputation</li>
                <li>2. <strong>Public repayment</strong> → Increases system trust</li>
                <li>3. <strong>Higher trust</strong> → More lenders participate</li>
                <li>4. <strong>More liquidity</strong> → Better rates and faster funding</li>
                <li>5. <strong>Better experience</strong> → More borrowers join</li>
                <li>6. <strong>Larger network</strong> → Stronger reputation signals</li>
              </ol>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4 text-green-800">Early Results (Aug-Sept 2025)</h4>
                <ul className="space-y-2 text-green-700">
                  <li>• <strong>Genesis loan:</strong> LOANCAST-001 for $789, repaid on time</li>
                  <li>• <strong>First 10 loans:</strong> 100% repayment rate</li>
                  <li>• <strong>Average funding time:</strong> 4.2 hours</li>
                  <li>• <strong>Viral coefficient:</strong> 2.3 (each user brings 2.3 more)</li>
                  <li>• <strong>Platform growth:</strong> 500% month-over-month</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4">Network Expansion Path</h4>
                <div className="bg-gray-800 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
                  <div><strong>Phase 1:</strong> Farcaster Native (Now)</div>
                  <div>- 50K addressable users</div>
                  <div>- $500 average loan</div>
                  <div>- $125M annual volume potential</div>
                  <div className="mt-2"><strong>Phase 2:</strong> Cross-Protocol (Q1 2026)</div>
                  <div>- Lens Protocol integration</div>
                  <div>- ENS reputation import</div>
                  <div>- 500K+ combined users</div>
                  <div className="mt-2"><strong>Phase 3:</strong> Identity Aggregation (Q2 2026)</div>
                  <div>- WorldID verification</div>
                  <div>- Gitcoin Passport scoring</div>
                  <div>- Traditional credit score bridges</div>
                  <div className="mt-2"><strong>Phase 4:</strong> Global Social Credit (2027+)</div>
                  <div>- Any identity system</div>
                  <div>- Any social graph</div>
                  <div>- Any currency</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 border-b-2 border-purple-200 pb-4">
            Beyond Human Credit
          </h2>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              As online identity becomes primary identity, LoanCast enables new categories of borrowers:
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4">AI Agents</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Borrow against future compute earnings</li>
                  <li>• Reputation built through successful transactions</li>
                  <li>• No human required for credit access</li>
                </ul>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4">DAOs and Communities</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Transform treasuries into member credit unions</li>
                  <li>• Programmatic lending based on contribution history</li>
                  <li>• Social tokens as additional reputation signals</li>
                </ul>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4">Creators and Builders</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Advance against future content revenue</li>
                  <li>• Fan-funded working capital</li>
                  <li>• Reputation from audience engagement</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 border-b-2 border-purple-200 pb-4">
            Regulatory Clarity
          </h2>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              LoanCast operates in the regulatory gap between social payments and securities:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4 text-yellow-800">Key Design Decisions</h4>
                <ul className="space-y-2 text-yellow-700">
                  <li>• <strong>True P2P:</strong> No pooling or intermediation</li>
                  <li>• <strong>Small Amounts:</strong> $1000 cap stays below thresholds</li>
                  <li>• <strong>Social Context:</strong> "Friends helping friends"</li>
                  <li>• <strong>Protocol Layer:</strong> Decentralized, no single operator</li>
                </ul>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4 text-orange-800">Compliance Strategy</h4>
                <ul className="space-y-2 text-orange-700">
                  <li>• Monitor evolving DeFi guidance</li>
                  <li>• Maintain geographic restrictions where required</li>
                  <li>• Preserve DAO transition option</li>
                  <li>• Focus on social lending, not investment returns</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 border-b-2 border-purple-200 pb-4">
            The Path Forward
          </h2>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h4 className="font-bold text-lg mb-4">Technical Roadmap</h4>
              <div className="bg-gray-800 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
                <div><strong>Q4 2025:</strong></div>
                <div>- Cross-chain reputation bridges</div>
                <div>- Privacy-preserving credit proofs</div>
                <div>- Automated insurance pools</div>
                <div>- Mobile-first experiences</div>
                <div className="mt-2"><strong>Q1 2026:</strong></div>
                <div>- Multi-protocol identity aggregation</div>
                <div>- DAO lending pool templates</div>
                <div>- Creator economy integrations</div>
                <div>- Reputation NFT system</div>
                <div className="mt-2"><strong>Q2 2026:</strong></div>
                <div>- AI agent credit lines</div>
                <div>- Merchant cash advances</div>
                <div>- Revenue-based lending</div>
                <div>- Global expansion</div>
              </div>
            </div>
          </div>
        </section>

        {/* Conclusion */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 border-b-2 border-purple-200 pb-4">
            The Endgame
          </h2>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              LoanCast demonstrates that <strong>reputation can replace collateral</strong> when identity persists and communities witness. As social graphs become economic graphs, as trust becomes computable, as reputation becomes portable—every community becomes a credit union, every social network becomes a financial network.
            </p>
            
            <p>
              We're not building another lending app. We're building the primitive that makes a thousand experiments possible. Where a Kenyan teacher can borrow for supplies based on community standing. Where an Indian developer can get conference funding from open-source reputation. Where a Brazilian creator can advance against future content.
            </p>
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
              <div className="text-center space-y-2">
                <div>Stage 1: Friends lending on Farcaster ✓</div>
                <div>Stage 2: Reputation bridges across protocols</div>
                <div>Stage 3: AI agents accessing capital through trust</div>
                <div>Stage 4: Global social credit network</div>
              </div>
            </div>
            
            <div className="text-center text-xl font-bold text-purple-900">
              <strong>The infrastructure for social credit now exists. Your cast is your credit. Your network is your net worth.</strong>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
            <span>LoanCast Protocol v1.0</span>
            <span className="hidden sm:inline">•</span>
            <span>Live at loancast.app</span>
            <span className="hidden sm:inline">•</span>
            <a href="https://github.com/loancast/protocol" className="text-purple-600 hover:underline">Open source: github.com/loancast/protocol</a>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <div>First loan: August 4, 2025 | First default: Never</div>
          </div>
        </footer>
      </div>
    </div>
    </>
  )
}