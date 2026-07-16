import { useParams, useNavigate } from 'react-router'
import { FlowAppShell } from '@/components/FlowAppShell'
import { Skeleton } from '@/components/ui/skeleton'
import { JokeCard } from '@/components/JokeCard'
import { BlockButton } from '@/components/BlockButton'
import { useCreatorProfile, FollowButton } from '@/features/follows'

function ProfileSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Skeleton style={{ height: 80, borderRadius: 16 }} />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {Array(6).fill(0).map((_, i) => (
          <Skeleton key={i} style={{ height: 160, width: '100%', borderRadius: 12 }} />
        ))}
      </div>
    </div>
  )
}

export function CreatorProfilePage() {
  const { creatorId } = useParams<{ creatorId: string }>()
  const navigate = useNavigate()
  const id = Number(creatorId)

  const { data, isLoading, isError, error } = useCreatorProfile(id)

  const is404 =
    isError && (error as { response?: { status?: number } })?.response?.status === 404

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell>
        <div style={{ padding: '40px 0', maxWidth: 860, margin: '0 auto' }}>
          {isLoading && <ProfileSkeleton />}

          {is404 && (
            <div
              style={{
                padding: '56px 32px',
                border: '1px dashed #E9E8E7',
                borderRadius: 18,
                textAlign: 'center',
                background: '#fff',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>👤</div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 22,
                  color: '#1A1A1A',
                  letterSpacing: '-0.01em',
                  marginBottom: 8,
                }}
              >
                Creator not found
              </h2>
              <p style={{ fontSize: 15, color: '#52525B' }}>
                This creator profile does not exist or has been removed.
              </p>
            </div>
          )}

          {isError && !is404 && (
            <div
              style={{
                padding: '32px',
                borderRadius: 16,
                background: '#FEF2F2',
                border: '1px solid #FEE2E2',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#991B1B', fontWeight: 600 }}>Failed to load creator profile</p>
            </div>
          )}

          {!isLoading && !isError && data && (
            <>
              {/* Identity header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  marginBottom: 32,
                  background: '#fff',
                  border: '1px solid #E9E8E7',
                  borderRadius: 16,
                  padding: '24px 28px',
                }}
              >
                <div>
                  <h1
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 900,
                      fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                      letterSpacing: '-0.02em',
                      color: '#1A1A1A',
                      lineHeight: 1.1,
                      margin: 0,
                    }}
                  >
                    {data.display_name}
                  </h1>
                  <div
                    style={{
                      fontSize: 15,
                      color: '#71717A',
                      marginTop: 4,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {data.handle}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 20,
                      marginTop: 12,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <span style={{ fontSize: 14, color: '#52525B' }}>
                      <span style={{ fontWeight: 700, color: '#1A1A1A' }}>
                        {data.follower_count.toLocaleString()}
                      </span>{' '}
                      Followers
                    </span>
                    <span style={{ fontSize: 14, color: '#52525B' }}>
                      <span style={{ fontWeight: 700, color: '#1A1A1A' }}>
                        {data.published_jokes.toLocaleString()}
                      </span>{' '}
                      Jokes
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FollowButton
                    creatorId={data.id}
                    isFollowing={data.is_following}
                    followerCount={data.follower_count}
                  />
                  {/* Block only for an authenticated, non-self viewer (same gate
                      FollowButton uses: is_following is null for anon/self). */}
                  {data.is_following !== null && (
                    <BlockButton
                      user={{ id: data.id, name: data.display_name, username: data.handle }}
                      onBlocked={() => navigate('/')}
                    />
                  )}
                </div>
              </div>

              {/* Jokes grid */}
              {data.jokes.length === 0 ? (
                <div
                  style={{
                    padding: '40px 32px',
                    border: '1px dashed #E9E8E7',
                    borderRadius: 18,
                    textAlign: 'center',
                    background: '#fff',
                  }}
                >
                  <p style={{ fontSize: 15, color: '#52525B' }}>No jokes yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {data.jokes.map((joke) => (
                    <JokeCard key={joke.id} joke={joke} showReport />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </FlowAppShell>
    </div>
  )
}
