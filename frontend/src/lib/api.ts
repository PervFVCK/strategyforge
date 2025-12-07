import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token
        const refreshToken = useAuthStore.getState().refreshToken
        
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        })

        const { token, refreshToken: newRefreshToken } = response.data

        // Update tokens
        useAuthStore.getState().setTokens(token, newRefreshToken)

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed - logout user
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// API Error Handler
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message: string; error: string }>
    
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message
    }
    
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error
    }

    if (axiosError.message) {
      return axiosError.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}

// API Methods
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  register: async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name })
    return response.data
  },

  verifyMagicLink: async (token: string) => {
    const response = await api.post('/auth/verify-magic-link', { token })
    return response.data
  },

  googleOAuth: async (credential: string) => {
    const response = await api.post('/auth/google-oauth', { credential })
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('/me')
    return response.data
  },

  logout: async () => {
    await api.post('/auth/logout')
  },
}

export const backtestApi = {
  uploadFile: async (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(progress)
        }
      },
    })

    return response.data
  },

  runBacktest: async (data: {
    fileId: string
    strategy: string
    parameters: Record<string, unknown>
    startDate?: string
    endDate?: string
  }) => {
    const response = await api.post('/backtest', data)
    return response.data
  },

  getStrategies: async () => {
    const response = await api.get('/strategies')
    return response.data
  },

  getBacktestResult: async (id: string) => {
    const response = await api.get(`/backtest/${id}`)
    return response.data
  },
}

export default api
