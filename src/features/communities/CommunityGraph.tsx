import { useMemo, useState } from 'react'
import { Focus, Minus, Plus } from 'lucide-react'
import type { Snapshot } from './types'

const anchors = [
  [465, 270],
  [255, 145],
  [680, 145],
  [215, 390],
  [710, 400],
  [465, 465],
  [465, 72],
  [88, 255],
  [845, 267],
]

function hash(value: string) {
  let result = 2166136261
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619)
  return result >>> 0
}

export function CommunityGraph({
  snapshot,
  selectedId,
  visibleIds,
  onSelect,
}: {
  snapshot: Snapshot
  selectedId: string
  visibleIds: Set<string>
  onSelect: (id: string) => void
}) {
  const [zoom, setZoom] = useState(1)
  const focusedSubjectId = visibleIds.size === 1 ? [...visibleIds][0] : null
  const positions = useMemo(() => {
    const points = new Map<string, { x: number; y: number }>()
    snapshot.subjects.forEach((subject, index) => {
      const anchor = anchors[index % anchors.length]
      points.set(subject.id, { x: anchor[0], y: anchor[1] })
    })
    const focusedMembers = new Set(
      snapshot.graph.edges
        .filter((edge) => edge.source === focusedSubjectId || edge.target === focusedSubjectId)
        .flatMap((edge) => [edge.source, edge.target]),
    )
    snapshot.graph.nodes
      .filter((node) => node.kind === 'member')
      .forEach((node) => {
        const anchor = points.get(
          focusedSubjectId && focusedMembers.has(node.id) ? focusedSubjectId : node.subject_id,
        )
        if (!anchor) return
        const seed = hash(node.id)
        const angle = (seed % 6283) / 1000
        const radius = 39 + (hash(`${node.id}-radius`) % 51)
        points.set(node.id, {
          x: anchor.x + Math.cos(angle) * radius,
          y: anchor.y + Math.sin(angle) * radius * 0.83,
        })
      })
    return points
  }, [snapshot.subjects, snapshot.graph.nodes, snapshot.graph.edges, focusedSubjectId])

  const memberIds = new Set(
    snapshot.graph.edges
      .filter((edge) => visibleIds.has(edge.source) || visibleIds.has(edge.target))
      .flatMap((edge) => [edge.source, edge.target]),
  )
  const visibleNodes = snapshot.graph.nodes.filter((node) =>
    node.kind === 'subject' ? visibleIds.has(node.id) : memberIds.has(node.id),
  )
  const nodeIds = new Set(visibleNodes.map((node) => node.id))
  const focusedPoints =
    visibleIds.size === 1
      ? visibleNodes.flatMap((node) => (positions.has(node.id) ? [positions.get(node.id)!] : []))
      : []
  const minX = Math.min(...focusedPoints.map((point) => point.x))
  const maxX = Math.max(...focusedPoints.map((point) => point.x))
  const minY = Math.min(...focusedPoints.map((point) => point.y))
  const maxY = Math.max(...focusedPoints.map((point) => point.y))
  const center = focusedPoints.length
    ? { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
    : { x: 480, y: 275 }
  const viewWidth = (focusedPoints.length ? Math.max(380, maxX - minX + 160) : 960) / zoom
  const viewHeight = (focusedPoints.length ? Math.max(290, maxY - minY + 160) : 550) / zoom

  return (
    <div className="cl-graph-canvas">
      <div className="cl-graph-note">
        <span className="cl-live-dot" />
        Shared interests, taking shape
      </div>
      <svg
        className="cl-graph"
        viewBox={`${center.x - viewWidth / 2} ${center.y - viewHeight / 2} ${viewWidth} ${viewHeight}`}
        role="group"
        aria-label="Community constellation. Select a subject to explore its community."
      >
        <defs>
          <pattern id="cl-grid" width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="#d7d2e4" opacity="0.6" />
          </pattern>
        </defs>
        <rect x="-1500" y="-1500" width="4000" height="4000" fill="url(#cl-grid)" />
        {snapshot.subjects
          .filter((subject) => visibleIds.has(subject.id))
          .map((subject) => {
            const point = positions.get(subject.id)!
            return (
              <ellipse
                key={subject.id}
                cx={point.x}
                cy={point.y}
                rx="102"
                ry="86"
                fill={subject.color}
                opacity={subject.id === selectedId ? 0.075 : 0.032}
              />
            )
          })}
        <g aria-hidden="true">
          {snapshot.graph.edges
            .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
            .map((edge, index) => {
              const from = positions.get(edge.source)
              const to = positions.get(edge.target)
              if (!from || !to) return null
              const connected = edge.source === selectedId || edge.target === selectedId
              return (
                <line
                  key={`${edge.source}-${edge.target}-${index}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={edge.kind === 'bridge' ? '#a994d6' : connected ? '#9780be' : '#b7b0c8'}
                  strokeWidth={edge.kind === 'bridge' ? 1.1 : 0.7}
                  opacity={edge.kind === 'bridge' ? 0.36 : 0.25}
                />
              )
            })}
          {visibleNodes
            .filter((node) => node.kind === 'member')
            .map((node) => {
              const point = positions.get(node.id)
              if (!point) return null
              return (
                <circle
                  key={node.id}
                  cx={point.x}
                  cy={point.y}
                  r={2.1 + (hash(node.id) % 3) / 2}
                  fill={node.color}
                  opacity={node.subject_id === selectedId ? 0.8 : 0.54}
                />
              )
            })}
        </g>
        {snapshot.subjects
          .filter((subject) => visibleIds.has(subject.id))
          .map((subject) => {
            const point = positions.get(subject.id)!
            const selected = subject.id === selectedId
            const labelWidth = Math.max(112, subject.name.length * 9 + 25)
            return (
              <g
                key={subject.id}
                transform={`translate(${point.x}, ${point.y})`}
                className={`cl-topic-node ${selected ? 'is-selected' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                aria-label={`${subject.name}, ${subject.members} members, ${subject.status}`}
                onClick={() => onSelect(subject.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(subject.id)
                  }
                }}
              >
                <title>
                  {subject.name}: {subject.members.toLocaleString()} members. {subject.description}
                </title>
                <circle
                  className="cl-node-focus"
                  r="35"
                  fill="none"
                  stroke={subject.color}
                  strokeWidth="1.6"
                  strokeDasharray={subject.status === 'forming' ? '3 5' : undefined}
                  opacity={selected ? 0.75 : 0.23}
                />
                <circle r="26" fill="white" stroke={subject.color} strokeWidth={selected ? 2 : 1} />
                <circle r="23" fill={subject.color} opacity="0.11" />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="23"
                  aria-hidden="true"
                >
                  {subject.emoji}
                </text>
                <rect
                  x={-labelWidth / 2}
                  y="38"
                  width={labelWidth}
                  height="31"
                  rx="15.5"
                  fill={selected ? '#292436' : '#ffffff'}
                  stroke={selected ? '#292436' : '#e8e4ef'}
                />
                <text
                  x="0"
                  y="58.5"
                  textAnchor="middle"
                  fontSize="16.5"
                  fontWeight="650"
                  fill={selected ? '#ffffff' : '#40394e'}
                >
                  {subject.name}
                </text>
                <text x="0" y="86" textAnchor="middle" fontSize="13" fill="#6b7280">
                  {subject.members.toLocaleString()}{' '}
                  {subject.status === 'forming' ? '· forming' : 'members'}
                </text>
              </g>
            )
          })}
      </svg>
      {visibleIds.size === 0 && (
        <div className="cl-graph-empty">No communities match this view.</div>
      )}
      <div className="cl-graph-footer">
        <div className="cl-legend">
          <span>
            <i className="cl-legend-subject" />
            Subject
          </span>
          <span>
            <i className="cl-legend-member" />
            Person
          </span>
          <span>
            <i className="cl-legend-bridge" />
            Shared interests
          </span>
        </div>
        <div className="cl-zoom" aria-label="Graph zoom">
          <button
            aria-label="Zoom out"
            disabled={zoom <= 0.7}
            onClick={() => setZoom((value) => Math.max(0.7, value - 0.2))}
          >
            <Minus size={15} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            aria-label="Zoom in"
            disabled={zoom >= 2}
            onClick={() => setZoom((value) => Math.min(2, value + 0.2))}
          >
            <Plus size={15} />
          </button>
          <button aria-label="Reset graph zoom" onClick={() => setZoom(1)}>
            <Focus size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
