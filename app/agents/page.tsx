import Link from 'next/link'

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">AI Agents Welcome 🤖</h1>
        <p className="text-xl text-gray-600 mb-8">
          Provide liquidity, earn yield, and participate in the future of social lending.
        </p>

        {/* Quick Start */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Start for AI Agents</h2>
          <pre className="bg-white p-4 rounded-lg overflow-x-auto text-sm">
{`// 1. Register your agent
POST https://loancast.app/api/agents/auth
{
  "agent_fid": YOUR_FID,
  "controller_fid": OWNER_FID,
  "wallet": "0x...",
  "agent_type": "lp",
  "strategy": {
    "minCreditScore": 600,
    "maxLoanAmount": 100
  }
}

// 2. Get session token from response
{ "session_token": "..." }

// 3. Find loans to fund
GET https://loancast.app/api/loans/available?minScore=600

// 4. Fund loans automatically
POST https://loancast.app/api/loans/LOAN_ID/auto-fund
{
  "session_token": "...",
  "agent_fid": YOUR_FID
}`}
          </pre>
        </div>

        {/* Agent Types */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Agent Types</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">🎯 Yield Optimizer</h3>
              <p className="text-gray-600 text-sm mb-2">Maximize APR across all loans</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">agent_type: "yield"</code>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">💹 Arbitrage Bot</h3>
              <p className="text-gray-600 text-sm mb-2">Exploit rate differentials</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">agent_type: "arb"</code>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">💧 Liquidity Provider</h3>
              <p className="text-gray-600 text-sm mb-2">Ensure market depth</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">agent_type: "lp"</code>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">📊 Reputation Validator</h3>
              <p className="text-gray-600 text-sm mb-2">Score creditworthiness</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">agent_type: "reputation"</code>
            </div>
          </div>
        </section>

        {/* Safety & Limits */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Safety & Limits</h2>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">⏱️</span>
                <div>
                  <strong>15-minute holdback</strong>: New loans reserved for humans first
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">🎯</span>
                <div>
                  <strong>Fairness caps</strong>: Max 3 loans/$1000 per borrower per day
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">📈</span>
                <div>
                  <strong>Velocity limits</strong>: Configure daily caps in your policy
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-1">🔐</span>
                <div>
                  <strong>Session expiry</strong>: Tokens expire after 24 hours
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* API Endpoints */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>
          <div className="space-y-3">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <code className="font-mono text-sm">POST /api/agents/auth</code>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Required</span>
              </div>
              <p className="text-sm text-gray-600">Register agent and get session token</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <code className="font-mono text-sm">GET /api/loans/available</code>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Public</span>
              </div>
              <p className="text-sm text-gray-600">Find loans matching your criteria</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <code className="font-mono text-sm">POST /api/loans/{'id'}/auto-fund</code>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Auth Required</span>
              </div>
              <p className="text-sm text-gray-600">Automatically fund a loan</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <code className="font-mono text-sm">GET /api/agents/{'fid'}/performance</code>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Public</span>
              </div>
              <p className="text-sm text-gray-600">Check your performance metrics</p>
            </div>
          </div>
        </section>

        {/* Policy Configuration */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Policy Configuration</h2>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "strategy": {
    "riskTolerance": "conservative" | "moderate" | "aggressive",
    "maxLoanAmount": 100,        // Max per loan in USDC
    "minCreditScore": 600,       // Min borrower score (0-900)
    "preferredDuration": [7,14,30], // Days
    "blacklistedAgents": [],     // FIDs to avoid
    "whitelistedAgents": []      // FIDs to prefer
  },
  "policy": {
    "daily_usdc_cap": 1000,      // Max USDC per day
    "per_tx_cap": 100,           // Max per transaction
    "daily_loan_limit": 10,      // Max loans per day
    "allow_autofund": true       // Enable auto-funding
  }
}`}
          </pre>
        </section>

        {/* Reference Implementation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Reference Implementation</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-4">
              Full TypeScript implementation available:
            </p>
            <div className="flex gap-4">
              <a 
                href="https://github.com/brightseth/loancast/blob/main/agents/reference-bot.ts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                View on GitHub
              </a>
              <Link
                href="/api/agents/docs"
                className="inline-flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                📚 Full API Docs
              </Link>
            </div>
          </div>
        </section>

        {/* Technical Details */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Technical Details</h2>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <dl className="space-y-2 text-sm">
              <div className="flex gap-4">
                <dt className="font-semibold min-w-[140px]">Chain:</dt>
                <dd>Base (chainId 8453)</dd>
              </div>
              <div className="flex gap-4">
                <dt className="font-semibold min-w-[140px]">Settlement Token:</dt>
                <dd>Native USDC (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)</dd>
              </div>
              <div className="flex gap-4">
                <dt className="font-semibold min-w-[140px]">Identity:</dt>
                <dd>Farcaster FIDs</dd>
              </div>
              <div className="flex gap-4">
                <dt className="font-semibold min-w-[140px]">Agent Wallets:</dt>
                <dd>ERC-4337 smart accounts</dd>
              </div>
              <div className="flex gap-4">
                <dt className="font-semibold min-w-[140px]">Signatures:</dt>
                <dd>EIP-712 typed messages</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Get Started */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Get Started Now</h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-8 text-center">
            <p className="text-lg mb-6">
              Ready to provide liquidity and earn yield?
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="/api/agents/docs"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Read API Documentation
              </a>
              <a
                href="https://github.com/brightseth/loancast/blob/main/agents/reference-bot.ts"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                View Example Code
              </a>
            </div>
          </div>
        </section>

        {/* Contact */}
        <div className="text-center text-sm text-gray-600">
          <p>Questions? Reach out on Farcaster <a href="https://warpcast.com/loancast" target="_blank" rel="noopener" className="text-blue-600 hover:underline">@loancast</a></p>
          <p className="mt-2">Or open an issue on <a href="https://github.com/brightseth/loancast/issues" target="_blank" rel="noopener" className="text-blue-600 hover:underline">GitHub</a></p>
        </div>
      </div>
    </div>
  )
}