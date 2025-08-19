'use client'

export default function ReputationScoring() {
  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
      <h3 className="text-lg font-semibold mb-4 text-center">Reputation Algorithm Evolution</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Version 1.0 */}
        <div className="bg-white rounded-lg p-4 border border-gray-300">
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-blue-500">v1.0</span> Current Algorithm
          </h4>
          
          <div className="bg-gray-50 rounded p-3 font-mono text-xs mb-3">
            <div className="text-gray-700">
              Score = <br/>
              <span className="ml-4">400 × √(followers/1000)</span><br/>
              <span className="ml-4">+ 400 × (successful/total)</span><br/>
              <span className="ml-4">+ 200 × (days/365)</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Social Proof</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '40%'}}></div>
                </div>
                <span className="text-xs font-semibold">40%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Loan History</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '40%'}}></div>
                </div>
                <span className="text-xs font-semibold">40%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Account Age</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '20%'}}></div>
                </div>
                <span className="text-xs font-semibold">20%</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t text-xs text-gray-500">
            Max Score: <span className="font-semibold">900</span>
          </div>
        </div>

        {/* Version 2.0 */}
        <div className="bg-white rounded-lg p-4 border border-green-300">
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-green-500">v2.0</span> Enhanced Algorithm
          </h4>
          
          <div className="bg-green-50 rounded p-3 font-mono text-xs mb-3">
            <div className="text-gray-700">
              Score = <br/>
              <span className="ml-4">300 × √(followers/1000)</span><br/>
              <span className="ml-4">+ 300 × (successful/total)</span><br/>
              <span className="ml-4">+ 150 × (days/365)</span><br/>
              <span className="ml-4">+ 150 × (yield/1000)</span><br/>
              <span className="ml-4">+ 100 × agent_score</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Social Proof</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '30%'}}></div>
                </div>
                <span className="text-xs font-semibold">30%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Loan History</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '30%'}}></div>
                </div>
                <span className="text-xs font-semibold">30%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Account Age</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '15%'}}></div>
                </div>
                <span className="text-xs font-semibold">15%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Economic Value</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{width: '15%'}}></div>
                </div>
                <span className="text-xs font-semibold">15%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">AI Contribution</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{width: '10%'}}></div>
                </div>
                <span className="text-xs font-semibold">10%</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t text-xs text-gray-500">
            Max Score: <span className="font-semibold">1000+</span>
          </div>
        </div>
      </div>

      {/* AI Entity Scoring */}
      <div className="mt-6 bg-white rounded-lg p-4 border border-purple-300">
        <h4 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
          <span>🤖</span> AI Entity Scoring
        </h4>
        
        <div className="bg-purple-50 rounded p-3 font-mono text-xs mb-3">
          <div className="text-gray-700">
            AIScore = <br/>
            <span className="ml-4">400 × (revenue/10000)</span> <span className="text-gray-500">// Economic output</span><br/>
            <span className="ml-4">+ 300 × (success_rate)</span> <span className="text-gray-500">// Reliability</span><br/>
            <span className="ml-4">+ 200 × (interactions/1000)</span> <span className="text-gray-500">// Network value</span><br/>
            <span className="ml-4">+ 100 × creator_reputation</span> <span className="text-gray-500">// Human sponsor</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded p-2">
            <div className="font-semibold text-purple-700">Eden Spirits</div>
            <div className="text-xs text-gray-600">Creative AI borrowers with revenue streams</div>
          </div>
          <div className="bg-gray-50 rounded p-2">
            <div className="font-semibold text-purple-700">Yield Optimizers</div>
            <div className="text-xs text-gray-600">Algorithmic lenders maximizing APR</div>
          </div>
        </div>
      </div>

      {/* Credit Tiers */}
      <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-gray-300">
        <h4 className="font-semibold text-gray-700 mb-3">Credit Tiers & Limits</h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl mb-1">🥉</div>
            <div className="font-semibold text-sm">Bronze</div>
            <div className="text-xs text-gray-600">0-599 Score</div>
            <div className="text-sm font-bold text-orange-600">$200 max</div>
          </div>
          <div>
            <div className="text-2xl mb-1">🥈</div>
            <div className="font-semibold text-sm">Silver</div>
            <div className="text-xs text-gray-600">600-799 Score</div>
            <div className="text-sm font-bold text-gray-600">$500 max</div>
          </div>
          <div>
            <div className="text-2xl mb-1">🥇</div>
            <div className="font-semibold text-sm">Gold</div>
            <div className="text-xs text-gray-600">800+ Score</div>
            <div className="text-sm font-bold text-yellow-600">$1000 max</div>
          </div>
        </div>
      </div>
    </div>
  )
}