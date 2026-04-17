export interface User {
  id: number;
  phone: string;
  email: string;
  first_name: string;
  last_name: string;
  wallet_balance: number;
  account_number: string;
  is_verified: boolean;
  role: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    user: User;
  };
}

export interface RegisterRequest {
  phone: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginRequest {
  identifier: string; // phone or email
  password: string;
}

export interface VerifyOTPRequest {
  phone: string;
  code: string;
  purpose: 'register' | 'login' | 'reset';
}

export interface SetPINRequest {
  user_id: number;
  pin: string;
}

export interface APIError {
  success: false;
  error: string;
}
