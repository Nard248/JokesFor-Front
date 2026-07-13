import { Link } from 'react-router'
import { Settings, Edit3, Bookmark, FolderOpen, Flame, Award } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { useAuth } from '@/features/auth'
import { useProfile, useActivity, useAchievements } from '@/features/profile'

/**
 * ProfilePage — redesigned for iteration 4.
 *
 * Sections:
 *   1. Identity card (avatar + name + handle + bio + edit/settings buttons)
 *   2. Stats row (saved, collections, streak)
 *   3. Activity feed
 *   4. Achievements grid
 */
export function ProfilePage() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { data: activity } = useActivity(8)
  const { data: achievements } = useAchievements()

  const displayName = profile?.name ?? user?.first_name ?? user?.username ?? 'Friend'
  const handle = profile?.username ?? (user?.username ? `@${user.username}` : '@you')
  const bio = profile?.bio ?? 'No bio yet — give the people something to read.'
  const memberSince = profile?.memberSince
    ? new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="library">
        <div style={{ padding: '40px clamp(24px, 4vw, 56px)', maxWidth: 1200, margin: '0 auto' }}>
          {/* Identity card */}
          <article
            style={{
              padding: 'clamp(28px, 4vw, 40px)',
              background: 'linear-gradient(160deg, #FFFFFF 0%, #FBFAF7 100%)',
              border: '1px solid #E9E8E7',
              borderRadius: 24,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: -80,
                right: -80,
                width: 280,
                height: 280,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #F2E9FF, transparent 70%)',
              }}
            />
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', position: 'relative' }}>
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  style={{ width: 100, height: 100, borderRadius: 28, objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 28,
                    background: '#6A1CF6',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                    fontSize: 44,
                    letterSpacing: '-0.02em',
                    flexShrink: 0,
                  }}
                >
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 240 }}>
                <span className="eyebrow-mono">Member since {memberSince}</span>
                <h1
                  style={{
                    marginTop: 6,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                    fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                    letterSpacing: '-0.02em',
                    color: '#1A1A1A',
                    lineHeight: 1.05,
                  }}
                >
                  {displayName}
                </h1>
                <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 13, color: '#6A1CF6' }}>{handle}</div>
                <p style={{ marginTop: 12, fontSize: 16, color: '#52525B', lineHeight: 1.5, maxWidth: 580 }}>
                  {bio}
                </p>
                <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {/* The real, working profile editor is the "Public identity"
                      section on the Settings page (PATCHes /users/me/profile/). */}
                  <Link to="/settings" className="btn-flow-primary" style={{ height: 40, fontSize: 13, textDecoration: 'none' }}>
                    <Edit3 size={14} /> Edit profile
                  </Link>
                  <Link to="/settings" className="btn-flow-ghost" style={{ height: 40, fontSize: 13, textDecoration: 'none' }}>
                    <Settings size={14} /> Settings
                  </Link>
                </div>
              </div>
            </div>
          </article>

          {/* Stats row */}
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <ProfileStat icon={<Bookmark size={18} />} value={profile?.stats ? String(profile.stats.jokesSaved) : '—'} label="Saved jokes" accent="purple" />
            <ProfileStat icon={<FolderOpen size={18} />} value={profile?.stats ? String(profile.stats.collections) : '—'} label="Collections" accent="amber" />
            <ProfileStat icon={<Flame size={18} />} value={profile?.stats ? String(profile.stats.daysActive) : '—'} label="Days active" accent="lime" />
          </div>

          {/* Activity + Achievements */}
          <div
            style={{
              marginTop: 48,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
              gap: 24,
            }}
          >
            {/* Activity */}
            <section>
              <span className="eyebrow-mono">Recent activity</span>
              <h2
                style={{
                  marginTop: 4,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 28,
                  letterSpacing: '-0.02em',
                  color: '#1A1A1A',
                  marginBottom: 18,
                }}
              >
                What you've <em className="wink">been up to.</em>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(activity ?? []).map((a, i, arr) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid #E9E8E7' : '0',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: '#F2E9FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 18,
                      }}
                    >
                      {a.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: '#1A1A1A' }}>
                        {a.description}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', color: '#6B7280', marginTop: 2 }}>
                        {a.timeAgo}
                      </div>
                    </div>
                  </div>
                ))}
                {(!activity || activity.length === 0) && (
                  <p style={{ fontSize: 14, color: '#6B7280', padding: '14px 0' }}>No activity yet.</p>
                )}
              </div>
            </section>

            {/* Achievements */}
            <section>
              <span className="eyebrow-mono">Achievements</span>
              <h2
                style={{
                  marginTop: 4,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 28,
                  letterSpacing: '-0.02em',
                  color: '#1A1A1A',
                  marginBottom: 18,
                }}
              >
                Things you've <em className="wink">unlocked.</em>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                {(achievements ?? []).map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: 18,
                      borderRadius: 14,
                      background: a.unlocked ? '#FFC965' : '#F2F0F0',
                      color: a.unlocked ? '#5F4200' : '#6B7280',
                      textAlign: 'center',
                      opacity: a.unlocked ? 1 : 0.6,
                    }}
                  >
                    <div style={{ fontSize: 32 }}>{a.icon}</div>
                    <div style={{ marginTop: 8, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, letterSpacing: '-0.005em' }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 2, opacity: 0.85 }}>{a.description}</div>
                  </div>
                ))}
                {(!achievements || achievements.length === 0) && (
                  <div style={{ padding: 18, borderRadius: 14, background: '#F2F0F0', textAlign: 'center', color: '#6B7280' }}>
                    <Award size={24} style={{ margin: '0 auto', display: 'block' }} />
                    <div style={{ marginTop: 8, fontSize: 13 }}>No achievements yet.</div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </FlowAppShell>
    </div>
  )
}

function ProfileStat({ icon, value, label, accent }: { icon: React.ReactNode; value: string; label: string; accent: 'purple' | 'amber' | 'lime' }) {
  const palette = {
    purple: { bg: '#6A1CF6', fg: '#fff' },
    amber: { bg: '#FFC965', fg: '#5F4200' },
    lime: { bg: '#CAFD00', fg: '#3A4A00' },
  }[accent]
  return (
    <div
      style={{
        padding: 24,
        background: palette.bg,
        color: palette.fg,
        borderRadius: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.2)',
          color: palette.fg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32, lineHeight: 1, letterSpacing: '-0.01em' }}>
          {value}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            opacity: 0.85,
            marginTop: 4,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  )
}
