'use client'

import { useState, useEffect } from 'react'

interface ProfileData {
  display_name: string
  username: string
  pfp_url: string
  follower_count: number
  following_count: number
  power_badge: boolean
  bio?: {
    text: string
  }
  verifications?: string[]
  // Additional trust signals
  created_at?: string
  active_status?: string
}

interface ProfileBadgeProps {
  fid: number
  className?: string
  showStats?: boolean
}

export function ProfileBadge({ fid, className = '', showStats = true }: ProfileBadgeProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile(fid)
  }, [fid])

  const fetchProfile = async (fid: number) => {
    try {
      // This would call your Neynar API endpoint
      const response = await fetch(`/api/profiles/${fid}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        FID {fid}
      </div>
    )
  }

  const formatFollowerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  const getAccountAge = (createdAt?: string) => {
    if (!createdAt) return null
    
    const created = new Date(createdAt)
    const now = new Date()
    const diffMonths = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30))
    
    if (diffMonths < 1) return 'New account'
    if (diffMonths < 12) return `${diffMonths}mo old`
    const years = Math.floor(diffMonths / 12)
    return `${years}y old`
  }

  const getTrustScore = () => {
    if (!profile) return 0
    
    let score = 0
    
    // Follower count signals
    if (profile.follower_count >= 1000) score += 30
    else if (profile.follower_count >= 100) score += 20
    else if (profile.follower_count >= 10) score += 10
    
    // Power badge
    if (profile.power_badge) score += 25
    
    // Verifications
    if (profile.verifications && profile.verifications.length > 0) score += 15
    
    // Account age (rough estimate if no created_at)
    if (profile.follower_count > 50) score += 20 // Established account
    
    return Math.min(score, 100)
  }

  const getTrustLevel = (score: number) => {
    if (score >= 80) return { level: 'High', color: 'text-green-600', emoji: '🟢' }
    if (score >= 50) return { level: 'Medium', color: 'text-yellow-600', emoji: '🟡' }
    if (score >= 20) return { level: 'Low', color: 'text-orange-600', emoji: '🟠' }
    return { level: 'New', color: 'text-gray-500', emoji: '⚪' }
  }

  const trustScore = getTrustScore()
  const trustLevel = getTrustLevel(trustScore)
  const accountAge = getAccountAge(profile.created_at)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={profile.pfp_url}
        alt={profile.display_name}
        className="w-6 h-6 rounded-full"
        onError={(e) => {
          e.currentTarget.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${fid}`
        }}
      />
      <div className="flex items-center gap-1">
        <span className="font-medium text-sm">@{profile.username}</span>
        {profile.power_badge && (
          <span className="text-xs">⚡</span>
        )}
      </div>
      {showStats && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {/* Trust level indicator */}
          <span className={`flex items-center gap-1 ${trustLevel.color}`}>
            {trustLevel.emoji} {trustLevel.level}
          </span>
          
          {/* Follower count */}
          <span>{formatFollowerCount(profile.follower_count)} followers</span>
          
          {/* Account age if available */}
          {accountAge && (
            <span>• {accountAge}</span>
          )}
          
          {/* Verification badge */}
          {profile.verifications && profile.verifications.length > 0 && (
            <span>• ✓ Verified</span>
          )}
        </div>
      )}
    </div>
  )
}