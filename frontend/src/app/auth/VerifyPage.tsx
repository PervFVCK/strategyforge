import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { authApi, handleApiError } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'

export default function VerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuthStore()
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link - no token provided')
      return
    }

    verifyToken(token)
  }, [searchParams])

  const verifyToken = async (token: string) => {
    try {
      console.log('🔍 Verifying magic link token:', token)
      
      const response = await authApi.verifyMagicLink(token)
      
      console.log('✅ Magic link verified:', response)

      // Check if response has the correct structure
      if (!response.success || !response.data) {
        throw new Error('Invalid response from server')
      }

      const { user, token: jwtToken, refreshToken } = response.data

      console.log('👤 User data:', user)
      console.log('🔑 JWT Token:', jwtToken ? 'Present' : 'Missing')
      console.log('🔄 Refresh Token:', refreshToken ? 'Present' : 'Missing')

      // Store auth data
      login(user, jwtToken, refreshToken)
      
      console.log('💾 Auth data stored in Zustand')
      
      setStatus('success')
      setMessage('Login successful! Redirecting...')
      
      // Redirect after 1 second
      setTimeout(() => {
        console.log('🚀 Redirecting to dashboard...')
        navigate('/dashboard', { replace: true })
      }, 1000)
    } catch (err) {
      console.error('❌ Magic link verification failed:', err)
      setStatus('error')
      setMessage(handleApiError(err))
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card-premium rounded-2xl p-8 max-w-md w-full text-center space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
            <h2 className="text-2xl font-bold">Verifying...</h2>
            <p className="text-muted-foreground">Please wait while we verify your magic link</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-primary">{message}</h2>
            <p className="text-muted-foreground">Taking you to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">Verification Failed</h2>
            <p className="text-muted-foreground">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}
