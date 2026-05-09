import { Link } from 'react-router'
import { Bookmark, Share2, FolderOpen, Flame, Settings, Edit3, Lock } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useProfile, useActivity, useAchievements } from '@/features/profile'
import { cn } from '@/lib/utils'

const statIcons = [Bookmark, Share2, FolderOpen, Flame]
const statLabels = ['Jokes Saved', 'Jokes Shared', 'Collections', 'Days Active']
const statColors = ['#6A1CF6', '#AC8EFF', '#FFC965', '#CAFD00']

const humorDNAColors: Record<string, string> = {
  'Dad Jokes': '#FFC965',
  'Puns': '#CAFD00',
  'Sarcasm': '#AC8EFF',
  'Geeky': '#6A1CF6',
}

export function ProfilePage() {
  const { data: profile } = useProfile()
  const { data: activity = [] } = useActivity()
  const { data: achievements = [] } = useAchievements()

  if (!profile) {
    return <div className="px-4 lg:px-8 py-20 text-center text-[#6B7280]">Loading profile...</div>
  }

  const stats = [profile.stats.jokesSaved, profile.stats.jokesShared, profile.stats.collections, profile.stats.daysActive]

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-10 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <Card radius="lg" className="p-6 lg:p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-purple opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
            <div className="relative">
              <Avatar name={profile.name} size="xl" color="#6A1CF6" />
              <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-[#CAFD00] border-2 border-white flex items-center justify-center">
                <span className="text-[10px]">✓</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display font-bold text-2xl text-[#2E2F2F]">{profile.name}</h1>
                <Badge variant="default" size="sm">Premium</Badge>
              </div>
              <p className="text-sm text-[#6B7280] mb-1">{profile.username}</p>
              <p className="text-sm text-[#6B7280] mb-3">Member since {new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              <p className="text-[#52525B] text-sm max-w-md">{profile.bio}</p>
            </div>
            <div className="flex gap-2 lg:self-start">
              <Button variant="pill-outline" size="sm" className="gap-1.5" asChild>
                <Link to="/settings"><Edit3 className="size-3.5" /> Edit Profile</Link>
              </Button>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link to="/settings"><Settings className="size-4 text-[#6B7280]" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((value, i) => {
          const Icon = statIcons[i]
          return (
            <Card key={statLabels[i]} radius="md" className="p-4 text-center">
              <Icon className="size-6 mx-auto mb-2" style={{ color: statColors[i] }} />
              <p className="font-display font-bold text-2xl text-[#2E2F2F]">{value}</p>
              <p className="text-xs text-[#6B7280]">{statLabels[i]}</p>
            </Card>
          )
        })}
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        {/* Humor DNA */}
        <Card radius="lg" className="p-6 mb-6 lg:mb-0">
          <h2 className="font-display font-bold text-xl text-[#2E2F2F] mb-5">Your Humor DNA</h2>
          <div className="space-y-4">
            {profile.humorDNA.map((item) => (
              <div key={item.type}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-[#2E2F2F]">{item.type}</span>
                  <span className="text-sm font-bold" style={{ color: humorDNAColors[item.type] || '#6A1CF6' }}>{item.percentage}%</span>
                </div>
                <div className="h-3 bg-[#F2F0F0] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: humorDNAColors[item.type] || '#6A1CF6',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button variant="pill-outline" size="sm" className="mt-5" asChild>
            <Link to="/onboarding">Update Preferences</Link>
          </Button>
        </Card>

        {/* Recent Activity */}
        <Card radius="lg" className="p-6 mb-6 lg:mb-0">
          <h2 className="font-display font-bold text-xl text-[#2E2F2F] mb-5">Recent Activity</h2>
          <div className="space-y-4">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <span className="text-lg shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#2E2F2F]">{item.description}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{item.timeAgo}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Achievements */}
      <Card radius="lg" className="p-6 mt-6">
        <h2 className="font-display font-bold text-xl text-[#2E2F2F] mb-5">Achievements</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={cn(
                'rounded-[24px] p-4 text-center transition-all',
                ach.unlocked
                  ? 'bg-[#F7F0FF] hover:bg-[#6A1CF6]/10'
                  : 'bg-[#F2F0F0] opacity-50'
              )}
            >
              <span className="text-3xl block mb-2">{ach.unlocked ? ach.icon : <Lock className="size-7 mx-auto text-[#DDDCDC]" />}</span>
              <p className="font-semibold text-sm text-[#2E2F2F] mb-0.5">{ach.title}</p>
              <p className="text-[10px] text-[#6B7280]">{ach.description}</p>
              {ach.unlocked && ach.unlockedAt && (
                <p className="text-[9px] text-[#AC8EFF] font-semibold mt-1">{new Date(ach.unlockedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
