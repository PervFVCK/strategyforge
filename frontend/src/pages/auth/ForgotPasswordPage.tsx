import { useState } from 'react';
import { ArrowLeft, Mail, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'success'>('request');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validate email or phone
  const validateIdentifier = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0[789][01]\d{8})$/;
    const cleaned = value.replace(/\D/g, '');
    
    return emailRegex.test(value) || phoneRegex.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier.trim()) {
      setError('Please enter your email or phone number');
      return;
    }

    if (!validateIdentifier(identifier)) {
      setError('Please enter a valid email or phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.replace(/\D/g, ''), // Clean phone number
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store phone for OTP page
        localStorage.setItem('temp_phone', data.data.phone);
        localStorage.setItem('otp_purpose', 'reset');
        
        // Show success step
        setStep('success');
      } else {
        setError(data.error || 'Failed to send reset code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('Reset code resent! Check your phone/email.');
    } catch (err) {
      setError('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to login</span>
        </button>

        {/* Request Step */}
        {step === 'request' && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <Mail size={28} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                Forgot Password?
              </h1>
              <p className="text-gray-600 dark:text-slate-400">
                No worries! Enter your email or phone number and we'll send you a reset code
              </p>
            </div>

            {/* Form Card */}
            <div className="card">
              <div className="space-y-4">
                <div>
                  <label htmlFor="identifier" className="label">
                    Email or Phone Number
                  </label>
                  <input
                    type="text"
                    id="identifier"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError('');
                    }}
                    className="input-field"
                    placeholder="email@example.com or 0801234567"
                    disabled={loading}
                    autoFocus
                  />
                  {error && (
                    <div className="error-text mt-2">
                      <XCircle size={14} />
                      {error}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !identifier}
                  className="btn-primary"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      Sending Code...
                    </span>
                  ) : (
                    'Send Reset Code'
                  )}
                </button>
              </div>

              {/* Back to Login Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Remember your password?{' '}
                  <a href="/login" className="link font-medium">
                    Sign in
                  </a>
                </p>
              </div>
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-medium">Need help?</span> Contact our support team if you can't access your account.
              </p>
            </div>
          </>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <>
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                Check Your Phone
              </h1>
              <p className="text-gray-600 dark:text-slate-400">
                We've sent a 6-digit reset code to
              </p>
              <p className="text-gray-900 dark:text-slate-100 font-medium mt-1">
                {identifier}
              </p>
            </div>

            {/* Info Card */}
            <div className="card">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                    Enter the code in the next screen to verify your identity and reset your password.
                  </p>
                </div>

                <button
                  onClick={() => {
                    // Store identifier and navigate to OTP page
                    localStorage.setItem('temp_phone', identifier);
                    localStorage.setItem('otp_purpose', 'reset');
                    navigate('/verify-otp');
                  }}
                  className="btn-primary"
                >
                  Continue to Verification
                </button>

                {/* Resend Option */}
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                    Didn't receive the code?
                  </p>
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    {loading ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <span className="font-medium">Security tip:</span> Never share your reset code with anyone. PayOM staff will never ask for your code.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
