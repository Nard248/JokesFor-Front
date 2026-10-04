import { useMemo } from 'react'
import type { Community, CommunityBridge } from './types'

/**
 * CommunityMap — communities as bubbles, shared members as bridges.
 *
 * Privacy by construction: the server never sends people, only aggregate
 * counts, so this map can't draw individuals. The dots inside a bubble are a
 * density encoding of the member count ("each dot ≈ N people"), not samples.
 * Forming communities (count withheld under 5) render as dashed outlines.
 *
 * Layout is a tiny deterministic force simulation (same data → same picture):
 * bubbles repel, bridges pull overlapping communities together.
 */
const W = 920
const H = 540
const MAX_DOTS = 34

interface Node {
  slug: string
  x: number
  y: number
  r: number
}

function radiusFor(community: Community): number {
  return 26 + 7 * Math.sqrt(community.members ?? 2)
}

function layout(communities: Community[], bridges: CommunityBridge[]): Map<string, Node> {
  const nodes: Node[] = communities.map((community, index) => {
    const angle = (index / Math.max(1, communities.length)) * Math.PI * 2
    const ring = index % 2 === 0 ? 0.32 : 0.42
    return {
      slug: community.slug,
      x: W / 2 + Math.cos(angle) * W * ring,
      y: H / 2 + Math.sin(angle) * H * ring,
      r: radiusFor(community),
    }
  })
  const bySlug = new Map(nodes.map((node) => [node.slug, node]))
  const maxBridge = Math.max(1, ...bridges.map((bridge) => bridge.members))
  for (let step = 0; step < 260; step++) {
    const cooling = 1 - step / 260
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        const dx = b.x - a.x || 0.01
        const dy = b.y - a.y || 0.01
        const distance = Math.hypot(dx, dy)
        const minimum = a.r + b.r + 26
        if (distance < minimum * 1.6) {
          const push = ((minimum * 1.6 - distance) / distance) * 0.18 * cooling
          a.x -= dx * push
          a.y -= dy * push
          b.x += dx * push
          b.y += dy * push
        }
      }
    }
    for (const bridge of bridges) {
      const a = bySlug.get(bridge.source)
      const b = bySlug.get(bridge.target)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const distance = Math.hypot(dx, dy) || 1
      const target = a.r + b.r + 34
      const pull = ((distance - target) / distance) * (0.03 + 0.07 * (bridge.members / maxBridge)) * cooling
      a.x += dx * pull
      a.y += dy * pull
      b.x -= dx * pull
      b.y -= dy * pull
    }
    for (const node of nodes) {
      node.x += (W / 2 - node.x) * 0.006 * cooling
      node.y += (H / 2 - node.y) * 0.01 * cooling
      node.x = Math.min(W - node.r - 8, Math.max(node.r + 8, node.x))
      node.y = Math.min(H - node.r - 26, Math.max(node.r + 8, node.y))
    }
  }
  return bySlug
}

/** Golden-angle (phyllotaxis) dot positions inside a circle of radius r. */
function dots(count: number, r: number): Array<[number, number]> {
  const out: Array<[number, number]> = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const distance = (r - 9) * Math.sqrt((i + 0.5) / Math.max(count, 1))
    out.push([Math.cos(i * golden) * distance, Math.sin(i * golden) * distance])
  }
  return out
}

export function CommunityMap({
  communities,
  bridges,
  selected,
  onSelect,
}: {
  communities: Community[]
  bridges: CommunityBridge[]
  selected: string | null
  onSelect: (slug: string) => void
}) {
  const positions = useMemo(() => layout(communities, bridges), [communities, bridges])
  const maxMembers = Math.max(1, ...communities.map((c) => c.members ?? 0))
  const perDot = Math.max(1, Math.ceil(maxMembers / MAX_DOTS))
  const maxBridge = Math.max(1, ...bridges.map((bridge) => bridge.members))
  const selectedBridges = new Set(
    bridges.filter((b) => b.source === selected || b.target === selected).flatMap((b) => [b.source, b.target]),
  )

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="group"
        aria-label="Map of communities and the members they share"
        className="block h-auto w-full"
      >
        <defs>
          <radialGradient id="cm-glow">
            <stop offset="0%" stopColor="#6A1CF6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#6A1CF6" stopOpacity="0" />
          </radialGradient>
        </defs>
        {bridges.map((bridge) => {
          const a = positions.get(bridge.source)
          const b = positions.get(bridge.target)
          if (!a || !b) return null
          const lit = selected !== null && (bridge.source === selected || bridge.target === selected)
          const mx = (a.x + b.x) / 2
          const my = (a.y + b.y) / 2 - Math.hypot(b.x - a.x, b.y - a.y) * 0.12
          return (
            <path
              key={`${bridge.source}-${bridge.target}`}
              d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
              fill="none"
              stroke={lit ? '#6A1CF6' : '#B9B4C7'}
              strokeOpacity={lit ? 0.75 : selected ? 0.18 : 0.42}
              strokeWidth={1.2 + 7 * (bridge.members / maxBridge)}
              strokeLinecap="round"
            >
              <title>{`${bridge.members} people belong to both`}</title>
            </path>
          )
        })}
        {communities.map((community) => {
          const node = positions.get(community.slug)
          if (!node) return null
          const isSelected = community.slug === selected
          const dimmed = selected !== null && !isSelected && !selectedBridges.has(community.slug)
          const forming = community.status === 'forming'
          const cooling = community.status === 'cooling'
          const stroke = cooling ? '#A1A1AA' : community.color
          const count = community.members === null ? 0 : Math.ceil(community.members / perDot)
          const yours = community.viewer?.member
          const label = `${community.name} community, ${community.status}, ${
            community.members === null ? 'fewer than 5' : community.members
          } members${yours ? ', you are a member' : ''}`
          return (
            <g
              key={community.slug}
              transform={`translate(${node.x} ${node.y})`}
              role="button"
              tabIndex={0}
              aria-label={label}
              aria-pressed={isSelected}
              onClick={() => onSelect(community.slug)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(community.slug)
                }
              }}
              className="cursor-pointer outline-none [&:focus-visible>circle.cm-ring]:stroke-[#1A1A1A]"
              style={{ opacity: dimmed ? 0.38 : 1, transition: 'opacity 200ms ease' }}
            >
              {isSelected && <circle r={node.r + 26} fill="url(#cm-glow)" />}
              {/* Opaque base so bridges pass *behind* bubbles, never through them. */}
              <circle r={node.r} fill="#fff" />
              <circle
                className="cm-ring"
                r={node.r}
                fill={stroke}
                fillOpacity={forming ? 0.04 : 0.12}
                stroke={stroke}
                strokeWidth={isSelected ? 3.5 : 2}
                strokeDasharray={forming ? '6 6' : undefined}
              />
              {dots(count, node.r).map(([x, y], index) => (
                <circle key={index} cx={x} cy={y} r={2.6} fill={stroke} fillOpacity={0.55} />
              ))}
              {yours && (
                <g transform={`translate(${node.r * 0.72} ${-node.r * 0.72})`}>
                  <circle r={11} fill="#6A1CF6" stroke="#fff" strokeWidth={2.5} />
                  <text textAnchor="middle" dy="0.35em" fontSize={9} fontWeight={800} fill="#fff">
                    YOU
                  </text>
                </g>
              )}
              <text textAnchor="middle" dy="0.35em" fontSize={node.r > 44 ? 26 : 20} aria-hidden>
                {community.emoji}
              </text>
              <text
                y={node.r + 17}
                textAnchor="middle"
                fontSize={13}
                fontWeight={700}
                fill="#1A1A1A"
                style={{ fontFamily: 'var(--font-display)' }}
                aria-hidden
              >
                {community.name}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6B7280]">
        <span>Bubble size = members</span>
        <span>Lines = people in both communities</span>
        <span>Dashed = forming</span>
        <span>Each dot ≈ {perDot === 1 ? '1 person' : `${perDot} people`}</span>
      </figcaption>
    </figure>
  )
}
