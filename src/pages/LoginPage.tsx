import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router'
import { useLogin } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import type { AxiosError } from 'axios'

interface ApiError {
  non_field_errors?: string[]
  email?: string[]
  password?: string[]
  detail?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loginMutation = useLogin()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          navigate(returnTo, { replace: true })
        },
        onError: (err) => {
          const axiosError = err as AxiosError<ApiError>
          const data = axiosError.response?.data

          if (data?.non_field_errors) {
            setError(data.non_field_errors[0])
          } else if (data?.email) {
            setError(`Email: ${data.email[0]}`)
          } else if (data?.password) {
            setError(`Password: ${data.password[0]}`)
          } else if (data?.detail) {
            setError(data.detail)
          } else {
            setError('Unable to login. Please check your credentials.')
          }
        },
      }
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6F6] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src="/Logos/compact_light.svg" alt="Jokes For" className="h-10 mx-auto" />
          </Link>
          <p className="mt-3 text-[#6B7280]">
            Welcome back! Sign in to continue.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[32px] shadow-lg border border-[#E9E8E7] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                placeholder="Your password"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="pill"
              size="xl"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary hover:text-primary-dark font-medium underline-offset-4 hover:underline"
            >
              Create one
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
