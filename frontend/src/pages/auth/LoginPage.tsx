import { useState } from 'react';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState<'password' | 'pin'>('password');
  
  // Password login state
  const [formData, setFormData] = useState({
    identifier: '', // email or phone
    password: '',
  });
  
  // PIN login state
  const [pinData, setPinData] = useState({
    phone: '',
    pin: ['', '', '', ''],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle password login input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // Handle PIN input
  const handlePinChange = (index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return;
    
    const newPin = [...pinData.pin];
    newPin[index] = value.slice(-1);
    setPinData(prev => ({ ...prev, pin: newPin }));
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all 4 digits filled
    if (index === 3 && value && newPin.every(d => d !== '')) {
      handlePinLogin(newPin.join(''));
    }
  };

  // Handle backspace for PIN
  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pinData.pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Password login - sends OTP
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store temp data for OTP verification
        localStorage.setItem('temp_phone', data.data.phone);
        localStorage.setItem('otp_purpose', 'login');
        
        if (rememberMe) {
          localStorage.setItem('remember_me', 'true');
          localStorage.setItem('saved_identifier', formData.identifier);
        }
        
        // Navigate to OTP page
        navigate('/verify-otp');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Quick PIN login
  const handlePinLogin = async (pin: string) => {
    if (!pinData.phone) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/login-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: pinData.phone.replace(/\D/g, ''),
          pin,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save tokens
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setError(data.error || 'Invalid PIN');
        setPinData(prev => ({ ...prev, pin: ['', '', '', ''] }));
        document.getElementById('pin-0')?.focus();
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">Welcome Back</h1>
          <p className="text-gray-600 dark:text-slate-400">Sign in to your PayOM account</p>
        </div>

        {/* Login Method Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setLoginMethod('password')}
            className={`
              flex-1 px-4 py-3 rounded-lg font-medium transition-all
              ${loginMethod === 'password' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
              }
            `}
          >
            Password Login
          </button>
          <button
            onClick={() => setLoginMethod('pin')}
            className={`
              flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2
              ${loginMethod === 'pin' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
              }
            `}
          >
            <Lock size={18} />
            Quick PIN
          </button>
        </div>

        <div className="card">
          {/* Password Login Form */}
          {loginMethod === 'password' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="identifier" className="label">
                  Email or Phone Number
                </label>
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="email@example.com or 0801234567"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field pr-12"
                    placeholder="••••••••"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
                  />
                  <span className="text-gray-700 dark:text-slate-300">Remember me</span>
                </label>
                <a href="/forgot-password" className="link">
                  Forgot password?
                </a>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handlePasswordLogin}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    Signing In...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          )}

          {/* PIN Login Form */}
          {loginMethod === 'pin' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="pin-phone" className="label">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="pin-phone"
                  value={pinData.phone}
                  onChange={(e) => {
                    setPinData(prev => ({ ...prev, phone: e.target.value }));
                    setError('');
                  }}
                  className="input-field"
                  placeholder="0801-234-5678"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label">Enter Your PIN</label>
                <div className="flex gap-3 justify-center">
                  {pinData.pin.map((digit, index) => (
                    <input
                      key={index}
                      id={`pin-${index}`}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(index, e)}
                      disabled={loading}
                      className={`
                        w-14 h-16 text-center text-2xl font-bold
                        bg-white dark:bg-slate-800 border-2 rounded-lg
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30
                        transition-all duration-200
                        ${digit ? 'border-blue-500' : 'border-gray-200 dark:border-slate-700'}
                        ${error ? 'border-red-500 dark:border-red-400' : ''}
                        disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed
                        text-gray-900 dark:text-slate-100
                      `}
                    />
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 text-center">
                  {error}
                </div>
              )}

              {/* Info Text */}
              <p className="text-sm text-gray-600 dark:text-slate-400 text-center">
                Enter your 4-digit PIN for quick access
              </p>
            </div>
          )}

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Don't have an account?{' '}
              <a href="/register" className="link font-medium">
                Create account
              </a>
            </p>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-medium">Secure login:</span> We'll send a verification code to your phone for added security.
          </p>
        </div>
      </div>
    </div>
  );
}
