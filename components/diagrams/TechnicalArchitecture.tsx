'use client'

export default function TechnicalArchitecture() {
  return (
    <div className="w-full bg-gray-50 rounded-xl p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-center">LoanCast v2.0 Technical Architecture</h3>
      
      <div className="space-y-8">
        {/* Smart Contract Layer */}
        <div className="bg-white rounded-lg p-4 border border-gray-300">
          <h4 className="font-semibold text-sm text-gray-700 mb-3">Smart Contract Layer (Base L2)</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded p-3 border border-blue-200">
              <div className="font-mono text-xs font-semibold text-blue-700">LoanCore.sol</div>
              <div className="text-xs text-gray-600 mt-1">
                • createLoan()<br/>
                • fundLoan()<br/>
                • repayLoan()<br/>
                • delegateToAgent()
              </div>
            </div>
            <div className="bg-green-50 rounded p-3 border border-green-200">
              <div className="font-mono text-xs font-semibold text-green-700">AgentCore.sol</div>
              <div className="text-xs text-gray-600 mt-1">
                • registerAgent()<br/>
                • assessRisk()<br/>
                • optimizeTerms()<br/>
                • evolveStrategy()
              </div>
            </div>
            <div className="bg-purple-50 rounded p-3 border border-purple-200">
              <div className="font-mono text-xs font-semibold text-purple-700">YieldCore.sol</div>
              <div className="text-xs text-gray-600 mt-1">
                • deployCapital()<br/>
                • harvestYield()<br/>
                • rebalance()<br/>
                • subsidizeDefaults()
              </div>
            </div>
          </div>
        </div>

        {/* Middleware Layer */}
        <div className="bg-white rounded-lg p-4 border border-gray-300">
          <h4 className="font-semibold text-sm text-gray-700 mb-3">Middleware & Indexing</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-50 rounded p-3 border border-orange-200">
              <div className="font-semibold text-xs text-orange-700">Farcaster Integration</div>
              <div className="text-xs text-gray-600 mt-1">
                • Cast monitoring<br/>
                • FID verification<br/>
                • Social graph analysis<br/>
                • Reputation attestations
              </div>
            </div>
            <div className="bg-cyan-50 rounded p-3 border border-cyan-200">
              <div className="font-semibold text-xs text-cyan-700">Data Services</div>
              <div className="text-xs text-gray-600 mt-1">
                • Supabase (loan state)<br/>
                • IPFS (metadata)<br/>
                • Dune Analytics<br/>
                • Price oracles
              </div>
            </div>
          </div>
        </div>

        {/* Agent Layer */}
        <div className="bg-white rounded-lg p-4 border border-gray-300">
          <h4 className="font-semibold text-sm text-gray-700 mb-3">Agent Intelligence Layer</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-red-50 rounded p-2 border border-red-200">
              <div className="text-xs font-semibold text-red-700">Guardian Agents</div>
              <div className="text-xs text-gray-600 mt-1">Risk monitoring</div>
            </div>
            <div className="bg-yellow-50 rounded p-2 border border-yellow-200">
              <div className="text-xs font-semibold text-yellow-700">Yield Agents</div>
              <div className="text-xs text-gray-600 mt-1">Capital optimization</div>
            </div>
            <div className="bg-indigo-50 rounded p-2 border border-indigo-200">
              <div className="text-xs font-semibold text-indigo-700">Strategy Agents</div>
              <div className="text-xs text-gray-600 mt-1">Product innovation</div>
            </div>
          </div>
        </div>

        {/* Flow Arrows */}
        <div className="flex justify-center">
          <div className="text-center">
            <div className="text-2xl">↕️</div>
            <div className="text-xs text-gray-500">Bidirectional Data Flow</div>
          </div>
        </div>

        {/* User Interface Layer */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-sm text-gray-700 mb-3 text-center">User Interfaces</h4>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white rounded p-2 border border-gray-300">
              <div className="text-xs font-semibold">Web App</div>
              <div className="text-xs text-gray-500">loancast.app</div>
            </div>
            <div className="bg-white rounded p-2 border border-gray-300">
              <div className="text-xs font-semibold">Farcaster</div>
              <div className="text-xs text-gray-500">Frames</div>
            </div>
            <div className="bg-white rounded p-2 border border-gray-300">
              <div className="text-xs font-semibold">API</div>
              <div className="text-xs text-gray-500">REST/GraphQL</div>
            </div>
            <div className="bg-white rounded p-2 border border-gray-300">
              <div className="text-xs font-semibold">SDK</div>
              <div className="text-xs text-gray-500">TypeScript</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Core Protocol</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>Agent Systems</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
            <span>Yield Management</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
            <span>External Integrations</span>
          </div>
        </div>
      </div>
    </div>
  )
}