import type { Joke } from '@/lib/api'

/** Contract: backend `communities/services.py` + `Docs/API/Communities.md`.
 *  Counts under `methodology.minimum_display` arrive as `null` — render them as
 *  "fewer than 5", never as zero. No payload ever identifies a person. */
export type CommunityStatus = 'active' | 'forming' | 'cooling'

export interface CommunityViewerState {
  affinity: number
  content_count: number
  inferred: boolean
  member: boolean
  explicit: 'joined' | 'left' | null
  /** 0..1 toward the personal membership threshold. */
  progress: number
}

export interface Community {
  slug: string
  name: string
  description: string
  emoji: string
  color: string
  status: CommunityStatus
  members: number | null
  engaged_members: number | null
  growth: number | null
  /** Null while fewer than 5 people contribute (it would describe individuals). */
  score: number | null
  joke_count: number
  /** Seven daily signal counts, oldest first. Null under 5 contributors. */
  activity: number[] | null
  explanation: string
  viewer: CommunityViewerState | null
}

export interface CommunityBridge {
  source: string
  target: string
  members: number
}

export interface CommunityMethodology {
  half_life_days: number
  membership_threshold: number
  minimum_content: number
  minimum_members: number
  content_cap: number
  weights: Record<string, number>
  window_days: number
  minimum_display: number
  description: string
  /** Sybil resistance: only accounts this old with signals on this many jokes count. */
  established_account_days?: number
  established_min_jokes?: number
  /** Per-count noise level (0 = off). Counts are day-stable, rounded to 5, hidden under 5. */
  noise_epsilon?: number
}

export interface CommunityDirectory {
  generated_at: string
  stats: {
    active_communities: number
    forming_communities: number
    members: number | null
    multi_community_members: number | null
    signals_7d: number
  }
  viewer: { counted: boolean; shares_analytics?: boolean; communities: string[] } | null
  /** UTC day the released counts come from (counts refresh daily). */
  counts_date?: string
  communities: Community[]
  bridges: CommunityBridge[]
  methodology: CommunityMethodology
}

export interface CommunityCreator {
  id: number
  display_name: string
  handle: string | null
  joke_count: number
}

export interface CommunityDetail {
  community: Community
  trending: Joke[]
  newest: Joke[]
  creators: CommunityCreator[]
  bridges: { slug: string; name: string; emoji: string; color: string; members: number }[]
}

// ── Creator Pro: GET /creators/me/communities/ ───────────────────────────────
export interface CreatorCommunityRow {
  slug: string
  name: string
  emoji: string
  color: string
  status: CommunityStatus
  members: number | null
  joke_count: number
  /** Coarsened: multiples of 5 (floor); null under 5. */
  reached_members: number | null
  /** Whole percent in 5% steps; null when reach is withheld. */
  reach_rate: number | null
  your_jokes: number
}

export interface CreatorOpportunity {
  kind: 'stronghold' | 'untapped' | 'emerging'
  slug: string
  name: string
  emoji: string
  evidence: string
  action: string
}

export interface CreatorCommunityReach {
  window_days: number
  /** UTC date of the daily snapshot creator numbers come from. */
  snapshot_date: string
  audience: { size: number | null; minimum: number }
  communities: CreatorCommunityRow[]
  opportunities: CreatorOpportunity[]
  measurement_notes: string[]
}
