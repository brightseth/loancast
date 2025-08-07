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
            Social Credit for the Network Age
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Version 0.9</span>
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
        
        {/* Abstract */}
        <section className="mb-16">
          <div className="bg-gray-50 p-8 rounded-lg border-l-4 border-purple-500">
            <h2 className="text-2xl font-bold mb-6 text-purple-900">Abstract</h2>
            <p className="text-lg leading-relaxed text-gray-700">
              Traditional credit systems fail the globally connected yet locally trusted communities emerging on decentralized social networks. LoanCast Protocol transforms social capital into financial capital by enabling uncollateralized peer-to-peer lending directly within Farcaster's social graph. Each loan request becomes a collectible cast, creating an immutable public record where reputation—not assets—serves as collateral. Early results show 100% repayment rates among identity-verified social network participants, suggesting that public social consequences effectively replace legal enforcement mechanisms when loan sizes match social trust thresholds.
            </p>
          </div>
        </section>

        {/* Section 1 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 border-b-2 border-purple-200 pb-4">
            1. The Credit Access Problem
          </h2>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              Modern credit infrastructure excludes billions despite ubiquitous digital connectivity. Traditional lenders require extensive documentation, credit history, and often collateral worth 150% of the loan value. Web2 peer-to-peer platforms like Prosper and LendingClub promised democratization but devolved into institutional investment vehicles with complex securities regulations and 36% default rates among anonymous borrowers.
            </p>
            
            <p>
              Meanwhile, informal social lending thrives. Rotating savings groups (ROSCAs) move $100B+ annually. Friends Venmo rent money. Communities fund emergencies through GoFundMe. Yet these trust-based transactions build no portable credit history, create no reputation value, and remain invisible to the formal financial system.
            </p>
            
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <p className="font-semibold text-purple-900">
                The core insight: <strong>identity persistence changes everything</strong>. When borrowers can't simply create new accounts after defaulting, when their entire social graph witnesses their financial behavior, when future access to community resources depends on past performance—social capital becomes effective collateral.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 border-b-2 border-purple-200 pb-4">
            2. The LoanCast Solution
          </h2>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              LoanCast Protocol leverages Farcaster's persistent identity system and native collectible mechanism to create frictionless social lending. The innovation is architectural simplicity: the cast itself becomes the loan contract.
            </p>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 border-b">
                <h3 className="font-bold text-lg">How it works:</h3>
              </div>
              <div className="p-6">
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
                    <div>
                      <strong>Borrower</strong> posts a loan request as a Farcaster collectible specifying amount (≤$1000), duration (≤30 days), and interest rate
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
                    <div>
                      <strong>Lenders</strong> participate in a 24-hour auction; highest bidder wins the collectible NFT
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
                    <div>
                      <strong>Settlement</strong> occurs instantly via USDC on Base; borrower receives funds minus Farcaster's 10% fee
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</span>
                    <div>
                      <strong>Repayment</strong> triggers on-chain confirmation and reputation score update
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">5</span>
                    <div>
                      <strong>Default</strong> results in permanent on-chain badge and social graph notification
                    </div>
                  </li>
                </ol>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-bold mb-4">The collectible cast innovation solves multiple problems:</h4>
              <ul className="space-y-2">
                <li><strong>Price discovery:</strong> Auction mechanism naturally prices credit risk</li>
                <li><strong>Social proof:</strong> Public casts create community accountability</li>
                <li><strong>Regulatory clarity:</strong> Direct peer-to-peer transfer avoids pooling/securities issues</li>
                <li><strong>Distribution:</strong> Loan requests appear natively in social feeds</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 border-b-2 border-purple-200 pb-4">
            3. Protocol Architecture
          </h2>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              LoanCast operates as a thin protocol layer atop existing infrastructure:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4">Core Components</h4>
                <ul className="space-y-3">
                  <li><strong>Identity:</strong> Farcaster IDs (FIDs) provide cryptographically-controlled persistent identity</li>
                  <li><strong>Settlement:</strong> USDC on Base enables instant, global, programmable payments</li>
                  <li><strong>Reputation:</strong> On-chain scoring system weights social graph (40%), payment history (40%), account age (20%)</li>
                  <li><strong>Enforcement:</strong> Smart contracts automate badge assignment; social layer handles consequences</li>
                </ul>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4">Key Design Decisions</h4>
                <ul className="space-y-3">
                  <li><strong>No custody:</strong> Protocol never holds user funds</li>
                  <li><strong>No pooling:</strong> Each loan is a direct peer-to-peer transaction</li>
                  <li><strong>No intermediation:</strong> Platform provides UI/indexing only</li>
                  <li><strong>Open source:</strong> Anyone can build alternative interfaces</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h4 className="font-bold text-lg mb-4">Reputation Mechanics</h4>
              <div className="bg-gray-800 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
                <div>Score = 400 * (followers/1000)^0.5 +</div>
                <div className="ml-8">400 * (successful_loans/total_loans) +</div>
                <div className="ml-8">200 * (account_age_days/365)</div>
                <div className="mt-4">Max loan = $200 (Score 0-599) | $500 (600-799) | $1000 (800+)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 border-b-2 border-purple-200 pb-4">
            4. Early Results and Network Effects
          </h2>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4 text-green-800">Genesis Period (Aug-Sept 2025)</h4>
                <ul className="space-y-2 text-green-700">
                  <li>• First loan (LOANCAST-001): $789 borrowed, repaid on time</li>
                  <li>• 10 subsequent loans: 100% repayment rate</li>
                  <li>• Average funding time: 4.2 hours</li>
                  <li>• Viral coefficient: Each loan generates 2.3 new users</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4 text-blue-800">Emerging Behaviors</h4>
                <ul className="space-y-2 text-blue-700">
                  <li>• Borrowers compete on reputation not just rates</li>
                  <li>• Lenders diversify across multiple small loans</li>
                  <li>• Community self-polices suspicious requests</li>
                  <li>• Repayment casts become social proof</li>
                </ul>
              </div>
            </div>

            <p>
              <strong>Network effects compound quickly:</strong> Each successful loan increases system trust. Public defaults educate risk assessment. Reputation scores become social currency. Integration opportunities multiply (DAOs, creators, merchants).
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 border-b-2 border-purple-200 pb-4">
            5. Regulatory Approach
          </h2>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              LoanCast operates in the regulatory gap between social payments and securities:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4 text-yellow-800">Key Protections</h4>
                <ul className="space-y-2 text-yellow-700">
                  <li>• True peer-to-peer: No pooling or note reselling</li>
                  <li>• Small amounts: Max $1000 keeps below most regulatory thresholds</li>
                  <li>• Social context: Positions as "friends helping friends"</li>
                  <li>• Protocol layer: Decentralized architecture resists single points of control</li>
                </ul>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4 text-orange-800">Compliance Strategy</h4>
                <ul className="space-y-2 text-orange-700">
                  <li>• Monitor SEC guidance on DeFi lending</li>
                  <li>• Maintain dialogue with innovation offices</li>
                  <li>• Implement geographic restrictions if required</li>
                  <li>• Preserve option to transition to DAO governance</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 border-b-2 border-purple-200 pb-4">
            6. Future Directions
          </h2>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4">Technical Roadmap</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Cross-chain reputation bridges (Lens, ENS)</li>
                  <li>• Privacy-preserving proofs for sensitive loans</li>
                  <li>• Automated insurance pools for lender protection</li>
                  <li>• SDK for community-specific implementations</li>
                </ul>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4">Market Expansion</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Creator advances against future content revenue</li>
                  <li>• DAO treasury management via member lending</li>
                  <li>• Merchant credit for on-chain commerce</li>
                  <li>• International remittance via social vouching</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h4 className="font-bold text-lg mb-4">The Bigger Vision</h4>
                <p className="text-sm">
                  Every community becomes a credit union, every reputation becomes a credit score, every social network becomes a financial network.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Conclusion */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-8 rounded-lg border border-purple-200">
            <p className="text-lg leading-relaxed text-gray-800">
              LoanCast demonstrates that reputation can replace collateral when identity persists and communities witness. As online identity becomes primary identity, as social graphs become economic graphs, as trust becomes computable—the protocol layer for social credit now exists. <strong>The experiment begins.</strong>
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
            <span>LoanCast Protocol v0.9</span>
            <span className="hidden sm:inline">•</span>
            <a href="https://github.com/loancast/protocol" className="text-purple-600 hover:underline">Open source: github.com/loancast/protocol</a>
            <span className="hidden sm:inline">•</span>
            <a href="https://loancast.app" className="text-purple-600 hover:underline">Live on Farcaster: loancast.app</a>
          </div>
        </footer>
      </div>
    </div>
    </>
  )
}