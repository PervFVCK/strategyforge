import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format phone number: 08012345678 → 0801-234-5678
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

// Format currency: 5000 → ₦5,000.00
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate Nigerian phone
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^(0[789][01]\d{8}|234[789][01]\d{8})$/.test(cleaned);
}

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number; // 0-4
  feedback: string;
} {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const feedback = [
    'Very weak',
    'Weak',
    'Fair',
    'Good',
    'Strong',
  ][Math.min(score, 4)];

  return { score, feedback };
}
