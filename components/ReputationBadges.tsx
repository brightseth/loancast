'use client'

import { ReputationBadge } from '@/lib/reputation'

interface ReputationBadgesProps {
  badges: ReputationBadge[]
  showAll?: boolean
  className?: string
}

export function ReputationBadges({ badges, showAll = false, className = '' }: ReputationBadgesProps) {
  const displayBadges = showAll ? badges : badges.slice(0, 3)
  const remainingCount = badges.length - displayBadges.length

  if (badges.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No badges earned yet
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {displayBadges.map((badge) => (
          <div
            key={badge.id}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
            title={badge.description}
          >
            <span>{badge.icon}</span>
            <span>{badge.name}</span>
            {badge.rarity === 'legendary' && (
              <span className="text-xs">✨</span>
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <span>+{remainingCount} more</span>
          </div>
        )}
      </div>
      
      {showAll && badges.length > 0 && (
        <div className="text-xs text-gray-500">
          {badges.filter(b => b.rarity === 'legendary').length} legendary • {' '}
          {badges.filter(b => b.rarity === 'rare').length} rare • {' '}
          {badges.filter(b => b.rarity === 'uncommon').length} uncommon • {' '}
          {badges.filter(b => b.rarity === 'common').length} common
        </div>
      )}
    </div>
  )
}

interface BadgeShowcaseProps {
  badges: ReputationBadge[]
}

export function BadgeShowcase({ badges }: BadgeShowcaseProps) {
  const groupedBadges = {
    legendary: badges.filter(b => b.rarity === 'legendary'),
    rare: badges.filter(b => b.rarity === 'rare'),
    uncommon: badges.filter(b => b.rarity === 'uncommon'),
    common: badges.filter(b => b.rarity === 'common')
  }

  const rarityColors = {
    legendary: 'bg-gradient-to-r from-purple-400 to-pink-400',
    rare: 'bg-gradient-to-r from-blue-400 to-purple-400',
    uncommon: 'bg-gradient-to-r from-green-400 to-blue-400',
    common: 'bg-gradient-to-r from-gray-400 to-gray-500'
  }

  return (
    <div className="space-y-4">
      {Object.entries(groupedBadges).map(([rarity, badges]) => {
        if (badges.length === 0) return null
        
        return (
          <div key={rarity} className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 capitalize flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${rarityColors[rarity as keyof typeof rarityColors]}`}></div>
              {rarity} ({badges.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-3 rounded-lg border ${badge.color} hover:scale-105 transition-transform cursor-help`}
                  title={badge.requirement}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{badge.icon}</span>
                    <span className="font-medium text-sm">{badge.name}</span>
                  </div>
                  <p className="text-xs opacity-80">{badge.description}</p>
                  <p className="text-xs opacity-60 mt-1">{badge.requirement}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}