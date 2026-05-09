import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router'
import { useRegister } from '@/features/auth'
import { getGoogleAuthUrl } from '@/features/auth/google-oauth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Eye, EyeOff, Sparkles } from 'lucide-react'
import type { AxiosError } from 'axios'

interface ApiError {
  non_field_errors?: string[]
  email?: string[]
  password1?: string[]
  password2?: string[]
  detail?: string
}

export function RegisterPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password1, setPassword1] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registerMutation = useRegister()

  const handleGoogleSignUp = () => {
    setError(null)
    try {
      window.location.href = getGoogleAuthUrl('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in unavailable.')
    }
  }

  // Client-side validation
  const validateForm = (): string | null => {
    if (!email.trim()) {
      return 'Email is required'
    }
    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address'
    }
    if (password1.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (password1 !== password2) {
      return 'Passwords do not match'
    }
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Client-side validation first
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)

    registerMutation.mutate(
      { email, password1, password2 },
      {
        onSuccess: () => {
          navigate('/', { replace: true })
        },
        onError: (err) => {
          const axiosError = err as AxiosError<ApiError>
          const data = axiosError.response?.data

          if (data?.non_field_errors) {
            setError(data.non_field_errors[0])
          } else if (data?.email) {
            setError(`Email: ${data.email[0]}`)
          } else if (data?.password1) {
            setError(`Password: ${data.password1[0]}`)
          } else if (data?.password2) {
            setError(`Password: ${data.password2[0]}`)
          } else if (data?.detail) {
            setError(data.detail)
          } else {
            setError('Unable to create account. Please try again.')
          }
        },
      }
    )
  }

  const clearError = () => setError(null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6F6] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src="/Logos/compact_light.svg" alt="Jokes For" className="h-10 mx-auto" />
          </Link>
          <p className="mt-3 text-[#6B7280]">
            Create an account to save your favorite jokes!
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[32px] shadow-lg border border-[#E9E8E7] p-8">
          {/* Google Sign-Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={registerMutation.isPending}
            className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-full border border-[#E9E8E7] bg-white hover:bg-[#F8F6F6] transition-colors text-sm font-medium text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E9E8E7]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-muted-foreground">or sign up with email</span>
            </div>
          </div>

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
                  clearError()
                }}
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password1" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password1"
                  type={showPassword ? 'text' : 'password'}
                  value={password1}
                  onChange={(e) => {
                    setPassword1(e.target.value)
                    clearError()
                  }}
                  placeholder="At least 8 characters"
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="password2" className="block text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <Input
                id="password2"
                type={showPassword ? 'text' : 'password'}
                value={password2}
                onChange={(e) => {
                  setPassword2(e.target.value)
                  clearError()
                }}
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
              />
              {password2 && password1 !== password2 && (
                <p className="text-xs text-destructive">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="pill"
              size="xl"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary hover:text-primary-dark font-medium underline-offset-4 hover:underline"
            >
              Sign in
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
