export const APP_NAME = 'PayOM';
export const APP_TAGLINE = 'Your trusted financial partner';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_OTP: '/verify-otp',
  SET_PIN: '/set-pin',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
} as const;

export const OTP_LENGTH = 6;
export const PIN_LENGTH = 4;
export const OTP_EXPIRY_MINUTES = 5;

export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  INVALID_OTP: 'Invalid or expired OTP. Please try again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid Nigerian phone number.',
  PASSWORD_WEAK: 'Password must be at least 8 characters with uppercase, lowercase, and numbers.',
} as const;
