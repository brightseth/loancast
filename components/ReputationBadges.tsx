'use client'

import { Badge, getBadgeInfo } from '@/lib/reputation'

interface ReputationBadgesProps {
  badges: Badge[]
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
        {displayBadges.map((badge) => {
          return (
            <div
              key={badge.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
              title={badge.description}
            >
              <span>{badge.icon}</span>
              <span>{badge.name}</span>
            </div>
          )
        })}
        {remainingCount > 0 && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <span>+{remainingCount} more</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface BadgeShowcaseProps {
  badges: Badge[]
}

export function BadgeShowcase({ badges }: BadgeShowcaseProps) {
  if (badges.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No badges earned yet. Complete loans on time to earn reputation!
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {badges.map((badge) => {
        return (
          <div
            key={badge.id}
            className="p-4 rounded-lg border border-purple-200 bg-purple-50 hover:scale-105 transition-transform cursor-help"
            title={badge.description}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{badge.icon}</span>
              <span className="font-medium text-sm text-purple-900">{badge.name}</span>
            </div>
            <p className="text-xs text-purple-700">{badge.description}</p>
          </div>
        )
      })}
    </div>
  )
}