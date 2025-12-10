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
      setMessage('Invalid verification link')
      return
    }

    verifyToken(token)
  }, [searchParams])

  const verifyToken = async (token: string) => {
    try {
      const response = await authApi.verifyMagicLink(token)
      
      login(
        response.data.user,
        response.data.token,
        response.data.refreshToken
      )
      
      setStatus('success')
      setMessage('Login successful! Redirecting...')
      
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err) {
      setStatus('error')
      setMessage(handleApiError(err))
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card-premium rounded-2xl p-8 max-w-md w-full text-center space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-primary-400 mx-auto animate-spin" />
            <h2 className="text-2xl font-bold">Verifying...</h2>
            <p className="text-muted-foreground">Please wait while we verify your magic link</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-primary-400 mx-auto" />
            <h2 className="text-2xl font-bold text-primary-400">{message}</h2>
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
