import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Sparkles, TrendingUp } from 'lucide-react'
import { authApi, handleApiError } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, setLoading, setError, isLoading, error } = useAuthStore()

  const [isRegister, setIsRegister] = useState(false)
  const [isMagicLink, setIsMagicLink] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  })

  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isMagicLink) {
        // Send magic link
        await authApi.sendMagicLink(formData.email)
        setMagicLinkSent(true)
        return
      }

      let response
      if (isRegister) {
        // Register
        response = await authApi.register(
          formData.email,
          formData.password,
          formData.name
        )
      } else {
        // Login
        response = await authApi.login(formData.email, formData.password)
      }

      // Store auth data
      login(response.data.user, response.data.token, response.data.refreshToken)
      
      // Redirect to dashboard
      navigate('/dashboard')
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-background to-background opacity-50" />
      
      <div className="relative w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary/30">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-primary mb-2">
            StrategyForge
          </h1>
          <p className="text-muted-foreground">
            Built in Nigeria 🇳🇬 • For Africa • For the World
          </p>
        </div>

        {/* Auth Card */}
        <div className="card-premium rounded-2xl p-8 space-y-6">
          {magicLinkSent ? (
            // Magic link sent confirmation
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-900/50 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold">Check Your Email</h2>
              <p className="text-muted-foreground">
                We've sent a magic link to <span className="text-foreground font-medium">{formData.email}</span>
              </p>
              <button
                onClick={() => {
                  setMagicLinkSent(false)
                  setFormData({ email: '', password: '', name: '' })
                }}
                className="btn-secondary w-full"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <>
              {/* Tab Switcher */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => {
                    setIsRegister(false)
                    setIsMagicLink(false)
                  }}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                    !isRegister && !isMagicLink
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setIsRegister(true)
                    setIsMagicLink(false)
                  }}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                    isRegister
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name (Register only) */}
                {isRegister && !isMagicLink && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Chukwudi Okonkwo"
                      className="input-field"
                      required={isRegister}
                    />
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="you@example.com"
                      className="input-field pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                {!isMagicLink && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="••••••••"
                        className="input-field pl-10"
                        required
                      />
                    </div>
                    {isRegister && (
                      <p className="text-xs text-muted-foreground">
                        Must be 8+ characters with uppercase, lowercase, and digit
                      </p>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-destructive/20 border border-destructive/50 rounded-lg p-3">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="spinner" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {isMagicLink
                        ? 'Send Magic Link'
                        : isRegister
                        ? 'Create Account'
                        : 'Login'}
                    </>
                  )}
                </button>
              </form>

              {/* Magic Link Toggle */}
              {!isRegister && (
                <div className="text-center">
                  <button
                    onClick={() => setIsMagicLink(!isMagicLink)}
                    className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    {isMagicLink ? 'Use password instead' : 'Login with magic link'}
                  </button>
                </div>
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Coming soon
                  </span>
                </div>
              </div>

              {/* Google OAuth (Placeholder) */}
              <button
                type="button"
                disabled
                className="w-full py-2.5 px-4 border border-border rounded-lg font-medium text-muted-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to StrategyForge's{' '}
          <a href="#" className="text-primary-400 hover:text-primary-300">
            Terms
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary-400 hover:text-primary-300">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}
