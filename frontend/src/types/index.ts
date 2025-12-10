
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  isPro: boolean
  isVerified: boolean
  lastLoginAt?: string
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}
