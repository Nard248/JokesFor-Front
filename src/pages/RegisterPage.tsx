import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router'
import { useRegister } from '@/features/auth'
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
