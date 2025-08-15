'use client'

import { useState, useEffect } from 'react'
// Simple toggle component
function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span
        className={`${
          checked ? 'translate-x-6' : 'translate-x-1'
        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
      />
    </button>
  )
}

interface AutolendPrefs {
  active: boolean
  min_score?: number
  max_amount_usdc?: number
  max_duration_days?: number
  allow_human?: boolean
  allow_agent?: boolean
  daily_limit_usdc?: number
  per_borrower_limit_usdc?: number
}

export function AutolendSettings() {
  const [prefs, setPrefs] = useState<AutolendPrefs>({
    active: false,
    min_score: 50,
    max_amount_usdc: 100,
    max_duration_days: 30,
    allow_human: true,
    allow_agent: false,
    daily_limit_usdc: 500,
    per_borrower_limit_usdc: 100
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/human-autolend')
      if (response.ok) {
        const data = await response.json()
        setPrefs(data)
      } else if (response.status === 401) {
        setError('Please sign in to manage autolend preferences')
      } else {
        setError('Failed to load preferences')
      }
    } catch (err) {
      setError('Failed to load preferences')
      console.error('Load preferences error:', err)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch('/api/human-autolend', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prefs)
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else if (response.status === 403) {
        setError('Human autolend is disabled by the system')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save preferences')
      }
    } catch (err) {
      setError('Failed to save preferences')
      console.error('Save preferences error:', err)
    } finally {
      setSaving(false)
    }
  }

  const updatePref = (key: keyof AutolendPrefs, value: any) => {
    setPrefs(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Auto-Fund Settings</h3>
          <p className="text-sm text-gray-600 mt-1">
            Automatically fund loans that meet your criteria
          </p>
        </div>
        <Toggle
          checked={prefs.active}
          onChange={(checked) => updatePref('active', checked)}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">✅ Settings saved successfully</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Risk Criteria */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Risk Criteria</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Minimum Credit Score
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={prefs.min_score || 0}
                onChange={(e) => updatePref('min_score', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!prefs.active}
              />
              <p className="text-xs text-gray-500 mt-1">
                Only fund borrowers with this score or higher
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Max Duration (days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={prefs.max_duration_days || 30}
                onChange={(e) => updatePref('max_duration_days', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!prefs.active}
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum loan duration you'll fund
              </p>
            </div>
          </div>
        </div>

        {/* Amount Limits */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Amount Limits</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Max Per Loan ($)
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={prefs.max_amount_usdc || 100}
                onChange={(e) => updatePref('max_amount_usdc', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!prefs.active}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Daily Limit ($)
              </label>
              <input
                type="number"
                min="1"
                max="50000"
                value={prefs.daily_limit_usdc || 500}
                onChange={(e) => updatePref('daily_limit_usdc', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!prefs.active}
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum you'll lend per day
              </p>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm text-gray-700 mb-1">
              Per Borrower Limit ($)
            </label>
            <input
              type="number"
              min="1"
              max="5000"
              value={prefs.per_borrower_limit_usdc || 100}
              onChange={(e) => updatePref('per_borrower_limit_usdc', parseFloat(e.target.value))}
              className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!prefs.active}
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum you'll lend to any single borrower per day
            </p>
          </div>
        </div>

        {/* Borrower Types */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Allowed Borrower Types</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={prefs.allow_human || false}
                onChange={(e) => updatePref('allow_human', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={!prefs.active}
              />
              <span className="ml-2 text-sm text-gray-700">
                👤 Human Borrowers
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={prefs.allow_agent || false}
                onChange={(e) => updatePref('allow_agent', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={!prefs.active}
              />
              <span className="ml-2 text-sm text-gray-700">
                🤖 AI Agents
              </span>
              <span className="ml-2 text-xs text-gray-500">
                (New! Automated borrowers)
              </span>
            </label>
          </div>
          {!prefs.allow_human && !prefs.allow_agent && prefs.active && (
            <p className="text-xs text-amber-600 mt-2">
              ⚠️ You must allow at least one borrower type for auto-funding to work
            </p>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <button
            onClick={savePreferences}
            disabled={saving || !prefs.active && !(prefs.allow_human || prefs.allow_agent)}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {prefs.active && (
            <p className="text-xs text-gray-500 mt-2">
              💡 Your funds will be automatically deployed to loans matching these criteria
            </p>
          )}
        </div>
      </div>
    </div>
  )
}