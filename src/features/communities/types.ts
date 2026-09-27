export type Subject = {
  id: string
  name: string
  description: string
  color: string
  emoji: string
  members: number
  active_members: number
  growth: number
  score: number
  status: 'forming' | 'active' | 'cooling'
  joined: boolean
  affinity: number
  explanation: string
  activity: number[]
}

export type Snapshot = {
  meta: {
    is_demo: true
    simulated_at: string
    revision: number
    sampled_nodes: number
    total_members: number
    caption: string
  }
  stats: {
    participants: number
    active_communities: number
    emerging_communities: number
    interactions: number
    shares: number
    bridges: number
  }
  viewer: { id: string; name: string }
  subjects: Subject[]
  graph: {
    nodes: {
      id: string
      kind: 'subject' | 'member'
      subject_id: string
      label: string
      color: string
    }[]
    edges: { source: string; target: string; weight: number; kind: 'affinity' | 'bridge' }[]
  }
  activity: {
    id: string
    actor: string
    kind: string
    subject_id: string
    subject_name: string
    content_title: string
    created_at: string
    description: string
  }[]
  content: {
    id: string
    subject_id: string
    title: string
    punchline: string
    format: string
    creator: string
    likes: number
    shares: number
    trending_score: number
  }[]
  methodology: {
    half_life_days: number
    membership_threshold: number
    minimum_members: number
    minimum_content: number
    weights: Record<string, number>
    description: string
  }
}
