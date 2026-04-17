import api from './api';
import type { RegisterRequest, AuthResponse } from '../types';

export const authAPI = {
  // Register new user
  register: async (data: RegisterRequest) => {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: {
        user_id: number;
        phone: string;
        code: string; // OTP code (remove in production)
      };
    }>('/auth/register', data);
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (phone: string, code: string, purpose: string) => {
    const response = await api.post('/auth/verify-otp', {
      phone,
      code,
      purpose,
    });
    return response.data;
  },

  // Set PIN
  setPIN: async (userId: number, pin: string) => {
    const response = await api.post<AuthResponse>('/auth/set-pin', {
      user_id: userId,
      pin,
    });
    return response.data;
  },
};
