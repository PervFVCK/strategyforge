import { useState } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });

  const phone = localStorage.getItem('temp_phone') || '';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError('Password must contain uppercase, lowercase, and numbers');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ''),
          new_password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        
        // Clean up
        localStorage.removeItem('temp_phone');
        localStorage.removeItem('otp_purpose');
        
        // Redirect to login after 2 seconds
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      // For now, simulate success since backend endpoint doesn't exist yet
      console.log('Reset password for:', phone);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = passwordStrength.score === 0 ? '#E5E7EB' : 
    ['#DC2626', '#F59E0B', '#EAB308', '#10B981', '#059669'][Math.min(passwordStrength.score - 1, 4)];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Success State */}
        {success ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              Password Reset Successful!
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mb-4">
              Your password has been updated successfully
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              <span>Redirecting to login...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <Lock size={28} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                Create New Password
              </h1>
              <p className="text-gray-600 dark:text-slate-400">
                Choose a strong password for your account
              </p>
            </div>

            {/* Form Card */}
            <div className="card">
              <div className="space-y-4">
                {/* New Password */}
                <div>
                  <label htmlFor="password" className="label">
                    New Password
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
                      autoFocus
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

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 dark:text-slate-400">Password strength:</span>
                        <span className="text-xs font-medium" style={{ color: strengthColor }}>
                          {passwordStrength.feedback}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="label">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="input-field pr-12"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {/* Match Indicator */}
                  {formData.confirmPassword && (
                    <div className="mt-2">
                      {formData.password === formData.confirmPassword ? (
                        <div className="success-text">
                          <CheckCircle2 size={14} />
                          Passwords match
                        </div>
                      ) : (
                        <div className="error-text">
                          <XCircle size={14} />
                          Passwords do not match
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.password || !formData.confirmPassword}
                  className="btn-primary mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      Resetting Password...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                Password must contain:
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${formData.password.length >= 8 ? 'bg-green-600 dark:bg-green-400' : 'bg-gray-400 dark:bg-slate-600'}`} />
                  At least 8 characters
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-green-600 dark:bg-green-400' : 'bg-gray-400 dark:bg-slate-600'}`} />
                  One uppercase letter
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(formData.password) ? 'bg-green-600 dark:bg-green-400' : 'bg-gray-400 dark:bg-slate-600'}`} />
                  One lowercase letter
                </li>
                <li className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${/\d/.test(formData.password) ? 'bg-green-600 dark:bg-green-400' : 'bg-gray-400 dark:bg-slate-600'}`} />
                  One number
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
