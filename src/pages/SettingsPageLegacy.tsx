import { Link, useNavigate } from 'react-router'
import { Settings, User, Bell, Shield, Palette, AlertTriangle, LogOut } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Chip } from '@/components/ui/chip'
import { Input } from '@/components/ui/input'
import { useProfile } from '@/features/profile'
import { usePreferences, useUpdatePreferences } from '@/features/preferences'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { cn } from '@/lib/utils'

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors',
        checked ? 'bg-[#6A1CF6]' : 'bg-[#DDDCDC]'
      )}
    >
      <div className={cn(
        'absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-[22px]' : 'translate-x-0.5'
      )} />
    </button>
  )
}

export function SettingsPageLegacy() {
  const navigate = useNavigate()
  const { selectedHumorTypes } = useOnboardingStore()
  const { data: profile } = useProfile()
  const { data: prefs } = usePreferences()
  const updatePrefs = useUpdatePreferences()

  // Derive state from server preferences, with sensible defaults
  const notifications = prefs?.notifications ?? {
    dailyJoke: true,
    trendingAlerts: false,
    collectionUpdates: true,
    emailDigest: false,
  }
  const privacy = prefs?.privacy ?? {
    publicProfile: true,
    showActivity: true,
    shareAnalytics: false,
  }
  const theme = prefs?.theme ?? 'light'

  const setNotifications = (updated: typeof notifications) => {
    updatePrefs.mutate({ notifications: updated })
  }
  const setPrivacy = (updated: typeof privacy) => {
    updatePrefs.mutate({ privacy: updated })
  }
  const setTheme = (t: 'light' | 'dark' | 'system') => {
    updatePrefs.mutate({ theme: t })
  }

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Settings className="size-8 text-[#6A1CF6]" />
        <h1 className="font-display font-black text-3xl lg:text-4xl text-[#2E2F2F]">Settings</h1>
      </div>

      <div className="space-y-4">
        {/* Account */}
        <Card radius="lg" className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <User className="size-5 text-[#6A1CF6]" />
            <h2 className="font-display font-bold text-lg text-[#2E2F2F]">Account</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#52525B] mb-1.5">Email</label>
              <Input variant="pill-sm" defaultValue={profile?.email ?? ''} readOnly className="bg-[#F2F0F0] cursor-not-allowed" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#52525B] mb-1.5">First Name</label>
                <Input variant="pill-sm" defaultValue="Laugh" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#52525B] mb-1.5">Last Name</label>
                <Input variant="pill-sm" defaultValue="Master" />
              </div>
            </div>
            <Button variant="pill-outline" size="sm">Change Password</Button>
          </div>
        </Card>

        {/* Humor Preferences */}
        <Card radius="lg" className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎭</span>
              <h2 className="font-display font-bold text-lg text-[#2E2F2F]">Humor Preferences</h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {(selectedHumorTypes.length > 0 ? selectedHumorTypes : ['dad_jokes', 'puns', 'sarcasm']).map((type) => (
              <Chip key={type} selected className="pointer-events-none">
                {type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Chip>
            ))}
          </div>
          <Button variant="pill-outline" size="sm" asChild>
            <Link to="/onboarding">Update Preferences</Link>
          </Button>
        </Card>

        {/* Notifications */}
        <Card radius="lg" className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <Bell className="size-5 text-[#6A1CF6]" />
            <h2 className="font-display font-bold text-lg text-[#2E2F2F]">Notifications</h2>
          </div>
          <div className="space-y-4">
            {([
              { key: 'dailyJoke' as const, label: 'Daily Joke', desc: 'Get your personalized joke every morning' },
              { key: 'trendingAlerts' as const, label: 'Trending Alerts', desc: 'When jokes in your taste go viral' },
              { key: 'collectionUpdates' as const, label: 'Collection Updates', desc: 'When collections you follow get new jokes' },
              { key: 'emailDigest' as const, label: 'Weekly Email Digest', desc: 'Top jokes of the week in your inbox' },
            ]).map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#2E2F2F]">{item.label}</p>
                  <p className="text-xs text-[#6B7280]">{item.desc}</p>
                </div>
                <ToggleSwitch checked={notifications[item.key]} onChange={(v) => setNotifications({ ...notifications, [item.key]: v })} />
              </div>
            ))}
          </div>
        </Card>

        {/* Privacy */}
        <Card radius="lg" className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <Shield className="size-5 text-[#6A1CF6]" />
            <h2 className="font-display font-bold text-lg text-[#2E2F2F]">Privacy</h2>
          </div>
          <div className="space-y-4">
            {([
              { key: 'publicProfile' as const, label: 'Public Profile', desc: 'Let others see your profile and saved jokes' },
              { key: 'showActivity' as const, label: 'Show Activity', desc: 'Display your recent activity on profile' },
              { key: 'shareAnalytics' as const, label: 'Share Analytics', desc: 'Help us improve with anonymous usage data' },
            ]).map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#2E2F2F]">{item.label}</p>
                  <p className="text-xs text-[#6B7280]">{item.desc}</p>
                </div>
                <ToggleSwitch checked={privacy[item.key]} onChange={(v) => setPrivacy({ ...privacy, [item.key]: v })} />
              </div>
            ))}
          </div>
        </Card>

        {/* Appearance */}
        <Card radius="lg" className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <Palette className="size-5 text-[#6A1CF6]" />
            <h2 className="font-display font-bold text-lg text-[#2E2F2F]">Appearance</h2>
          </div>
          <div className="flex gap-3">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => t === 'light' && setTheme(t)}
                className={cn(
                  'flex-1 py-3 rounded-2xl text-sm font-semibold text-center transition-all border-2',
                  theme === t
                    ? 'border-[#6A1CF6] bg-[#F7F0FF] text-[#6A1CF6]'
                    : 'border-[#E9E8E7] text-[#6B7280]',
                  t !== 'light' && 'opacity-50 cursor-not-allowed'
                )}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t !== 'light' && <Badge variant="muted" size="sm" className="ml-1.5">Soon</Badge>}
              </button>
            ))}
          </div>
        </Card>

        {/* Danger Zone */}
        <Card radius="lg" className="p-6 border-2 border-red-200">
          <div className="flex items-center gap-3 mb-5">
            <AlertTriangle className="size-5 text-red-500" />
            <h2 className="font-display font-bold text-lg text-red-600">Danger Zone</h2>
          </div>
          <div className="flex flex-col lg:flex-row gap-3">
            <Button variant="pill-outline" className="gap-2 border-red-200 text-red-600 hover:bg-red-50" onClick={() => navigate('/login')}>
              <LogOut className="size-4" /> Log Out
            </Button>
            <Button variant="ghost" className="text-red-400 hover:text-red-600 text-sm">
              Delete Account
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
