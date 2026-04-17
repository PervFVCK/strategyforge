import { useState } from 'react';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Inside component
const navigate = useNavigate();

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });

  // Validate phone (Nigerian format)
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return /^(0[789][01]\d{8})$/.test(cleaned);
  };

  // Validate email
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Check password strength
  const checkPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const feedback = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][Math.min(score, 4)];
    setPasswordStrength({ score, feedback });
  };

  // Format phone as user types
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const formatted = formatPhone(value);
      setFormData(prev => ({ ...prev, phone: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (name === 'password') {
      checkPasswordStrength(value);
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Enter a valid Nigerian phone number';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Must contain uppercase, lowercase, and numbers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;
  setLoading(true);

  try {
    // Call your backend
    const response = await fetch('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formData.phone.replace(/\D/g, ''), // Remove dashes
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
      }),
    });

    const data = await response.json();

    if (data.success) {
  // Store temp data for OTP page
  localStorage.setItem('temp_phone', data.data.phone);
  localStorage.setItem('temp_user_id', data.data.user_id.toString());
  localStorage.setItem('otp_purpose', 'register');
  
  // Navigate to OTP page (instead of alert + redirect)
  navigate('/verify-otp');
  } else {
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('Network error. Please check your connection.');
  } finally {
    setLoading(false);
  }
};

  const strengthColor = passwordStrength.score === 0 ? '#E5E7EB' : 
    ['#DC2626', '#F59E0B', '#EAB308', '#10B981', '#059669'][Math.min(passwordStrength.score - 1, 4)];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join thousands using PayOM</p>
        </div>

        <div className="card">
          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="label">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="input-field"
                placeholder="Emmanuel"
              />
              {errors.firstName && (
                <div className="error-text">
                  <XCircle size={14} /> {errors.firstName}
                </div>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="label">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="input-field"
                placeholder="Okafor"
              />
              {errors.lastName && (
                <div className="error-text">
                  <XCircle size={14} /> {errors.lastName}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="label">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="0801-234-5678"
                maxLength={13}
              />
              {errors.phone && (
                <div className="error-text">
                  <XCircle size={14} /> {errors.phone}
                </div>
              )}
              {!errors.phone && formData.phone && validatePhone(formData.phone) && (
                <div className="success-text">
                  <CheckCircle2 size={14} /> Valid number
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="you@example.com"
              />
              {errors.email && (
                <div className="error-text">
                  <XCircle size={14} /> {errors.email}
                </div>
              )}
              {!errors.email && formData.email && validateEmail(formData.email) && (
                <div className="success-text">
                  <CheckCircle2 size={14} /> Valid email
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {formData.password && (
                <div className="mt-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">Strength:</span>
                    <span className="text-xs font-medium" style={{ color: strengthColor }}>
                      {passwordStrength.feedback}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full">
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${(passwordStrength.score / 4) * 100}%`,
                        backgroundColor: strengthColor,
                      }}
                    />
                  </div>
                </div>
              )}
              
              {errors.password && (
                <div className="error-text mt-1">
                  <XCircle size={14} /> {errors.password}
                </div>
              )}
            </div>

            <button onClick={handleSubmit} disabled={loading} className="btn-primary mt-6">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account? <a href="/login" className="link font-medium">Sign in</a>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          By creating an account, you agree to our <a href="#" className="link">Terms</a> and <a href="#" className="link">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
