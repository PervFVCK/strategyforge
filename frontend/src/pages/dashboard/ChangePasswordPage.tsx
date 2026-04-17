import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });

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

    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      setError('Current password is required');
      return false;
    }

    if (!formData.newPassword) {
      setError('New password is required');
      return false;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return false;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      setError('Password must contain uppercase, lowercase, and numbers');
      return false;
    }

    if (formData.newPassword === formData.currentPassword) {
      setError('New password must be different from current password');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
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
      const response = await api.post('/user/change-password', {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/settings');
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to change password');
      }
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to change password. Please try again.');
      }
      console.error('Change password error:', err);
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = passwordStrength.score === 0 ? '#E5E7EB' : 
    ['#DC2626', '#F59E0B', '#EAB308', '#10B981', '#059669'][Math.min(passwordStrength.score - 1, 4)];

  if (success) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              Password Changed!
            </h2>
            <p className="text-gray-600 dark:text-slate-400 mb-4">
              Your password has been updated successfully
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              <span>Redirecting...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Change Password</h1>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Update your login password</p>
          </div>
        </div>

        {/* Form */}
        <div className="card">
          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="label">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="input-field pr-12"
                  placeholder="Enter current password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="divider" />

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="label">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="input-field pr-12"
                  placeholder="Enter new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Password Strength */}
              {formData.newPassword && (
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
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field pr-12"
                  placeholder="Confirm new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Match Indicator */}
              {formData.confirmPassword && (
                <div className="mt-2">
                  {formData.newPassword === formData.confirmPassword ? (
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
              disabled={loading}
              className="btn-primary mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  Changing Password...
                </span>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-3">Password Requirements:</h4>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${formData.newPassword.length >= 8 ? 'bg-green-600 dark:bg-green-400' : 'bg-gray-400 dark:bg-slate-600'}`} />
              At least 8 characters long
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(formData.newPassword) ? 'bg-green-600 dark:bg-green-400' : 'bg-gray-400 dark:bg-slate-600'}`} />
              Contains uppercase letter
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(formData.newPassword) ? 'bg-green-600 dark:bg-green-400' : 'bg-gray-400 dark:bg-slate-600'}`} />
              Contains lowercase letter
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${/\d/.test(formData.newPassword) ? 'bg-green-600 dark:bg-green-400' : 'bg-gray-400 dark:bg-slate-600'}`} />
              Contains number
            </li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
