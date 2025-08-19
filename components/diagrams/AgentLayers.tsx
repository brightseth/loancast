'use client'

export default function AgentLayers() {
  return (
    <div className="w-full bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
      <h3 className="text-lg font-semibold mb-4 text-center">Three-Layer Agent Architecture</h3>
      
      <div className="space-y-4">
        {/* Layer 3 - Strategy Agents */}
        <div className="bg-white rounded-lg p-4 border-2 border-purple-300 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-purple-700">Layer 3: Strategy Agents</h4>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Credit Innovation</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">🎯</span>
                <div>
                  <div className="text-sm font-medium">Dynamic Pricing</div>
                  <div className="text-xs text-gray-600">Market-based interest rates</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">🔮</span>
                <div>
                  <div className="text-sm font-medium">Product Creation</div>
                  <div className="text-xs text-gray-600">Revenue-based loans, milestones</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">🤝</span>
                <div>
                  <div className="text-sm font-medium">Matching Engine</div>
                  <div className="text-xs text-gray-600">Optimal borrower-lender pairs</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">📈</span>
                <div>
                  <div className="text-sm font-medium">Pattern Learning</div>
                  <div className="text-xs text-gray-600">Evolving strategies from data</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layer 2 - Yield Agents */}
        <div className="bg-white rounded-lg p-4 border-2 border-green-300 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-green-700">Layer 2: Yield Agents</h4>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Capital Efficiency</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">💰</span>
                <div>
                  <div className="text-sm font-medium">Deploy to DeFi</div>
                  <div className="text-xs text-gray-600">Aave, Compound, Morpho</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">⚡</span>
                <div>
                  <div className="text-sm font-medium">Gas Optimization</div>
                  <div className="text-xs text-gray-600">Batch operations, timing</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">🔄</span>
                <div>
                  <div className="text-sm font-medium">Auto-Compound</div>
                  <div className="text-xs text-gray-600">Reinvest returns automatically</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">📊</span>
                <div>
                  <div className="text-sm font-medium">2-5% Extra APY</div>
                  <div className="text-xs text-gray-600">Additional returns for lenders</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layer 1 - Guardian Agents */}
        <div className="bg-white rounded-lg p-4 border-2 border-blue-300 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-700">Layer 1: Guardian Agents</h4>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Risk & Trust</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">👁️</span>
                <div>
                  <div className="text-sm font-medium">Wallet Monitoring</div>
                  <div className="text-xs text-gray-600">Dune/Nansen integration</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">🚨</span>
                <div>
                  <div className="text-sm font-medium">Default Prediction</div>
                  <div className="text-xs text-gray-600">7-day early warnings</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">💬</span>
                <div>
                  <div className="text-sm font-medium">Interventions</div>
                  <div className="text-xs text-gray-600">Reminders, refinancing</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">🏆</span>
                <div>
                  <div className="text-sm font-medium">ML Scoring</div>
                  <div className="text-xs text-gray-600">Enhanced reputation algos</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interconnections */}
        <div className="bg-white/50 rounded-lg p-3 border border-gray-300">
          <div className="text-center text-sm text-gray-700">
            <div className="font-semibold mb-2">🔗 Layer Interactions</div>
            <div className="flex justify-around text-xs">
              <div>Guardian → Yield: Risk signals</div>
              <div>Yield → Strategy: Return data</div>
              <div>Strategy → Guardian: New models</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}