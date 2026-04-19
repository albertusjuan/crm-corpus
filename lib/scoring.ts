export type ScoreTier = 'HOT' | 'WARM' | 'MID' | 'COLD'

export function calcScore(lead: {
  has_website: boolean
  google_review_count: number | null
  google_rating: number | null
  phone: string | null
  full_address: string | null
}): number {
  let score = 0

  // Primary opportunity signal
  if (!lead.has_website) score += 40

  // Business establishment (review volume)
  const reviews = lead.google_review_count ?? 0
  if (reviews >= 100) score += 25
  else if (reviews >= 50) score += 15
  else if (reviews >= 20) score += 10
  else if (reviews >= 5) score += 5

  // Reputation quality
  const rating = lead.google_rating ?? 0
  if (rating >= 4.5) score += 15
  else if (rating >= 4.0) score += 10
  else if (rating >= 3.5) score += 5

  // Contactability
  if (lead.phone) score += 15
  if (lead.full_address) score += 5

  return score
}

export function scoreTier(score: number): ScoreTier {
  if (score >= 80) return 'HOT'
  if (score >= 60) return 'WARM'
  if (score >= 40) return 'MID'
  return 'COLD'
}

export const TIER_STYLES: Record<ScoreTier, string> = {
  HOT:  'text-red-400 border-red-400/50',
  WARM: 'text-amber-400 border-amber-400/50',
  MID:  'text-yellow-600 border-yellow-600/50',
  COLD: 'text-zinc-600 border-zinc-700',
}
