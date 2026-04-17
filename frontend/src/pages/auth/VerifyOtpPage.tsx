import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get phone from localStorage (set during registration)
  const phone = localStorage.getItem('temp_phone') || '';
  const purpose = localStorage.getItem('otp_purpose') || 'register';

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP input change
  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take only last character
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (index === 5 && value && newOtp.every(digit => digit !== '')) {
      const code = newOtp.join('');
      handleVerify(code);
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pastedData.split('');
    
    // Fill remaining with empty strings
    while (newOtp.length < 6) {
      newOtp.push('');
    }
    
    setOtp(newOtp);
    setError('');

    // Focus last filled input or first empty
    const lastFilledIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastFilledIndex]?.focus();

    // Auto-submit if all 6 digits pasted
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  // Verify OTP
  const handleVerify = async (code: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ''),
          code,
          purpose,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        
        // If registration, go to PIN setup
        if (purpose === 'register') {
          setTimeout(() => navigate('/set-pin'), 1000);
        } 
        // If login, save tokens and go to dashboard
        else if (purpose === 'login') {
          localStorage.setItem('access_token', data.data.access_token);
          localStorage.setItem('refresh_token', data.data.refresh_token);
          localStorage.removeItem('temp_phone');
          localStorage.removeItem('otp_purpose');
          setTimeout(() => navigate('/dashboard'), 1000);
        }
        // If password reset, go to reset password page
        else if (purpose === 'reset') {
          setTimeout(() => navigate('/reset-password'), 1000);
        }
      } else {
        setError(data.error || 'Invalid or expired OTP');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Manual verify button click
  const handleSubmit = () => {
    const code = otp.join('');
    if (code.length === 6) {
      handleVerify(code);
    } else {
      setError('Please enter all 6 digits');
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setLoading(true);
    setError('');

    try {
      // If register, call register again; if login, call login again
      const endpoint = purpose === 'register' ? '/auth/register' : '/auth/login';
      
      // You'll need to store original data or use a dedicated resend endpoint
      // For now, we'll show a message
      setTimeLeft(300);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      // TODO: Call actual resend endpoint
      alert('Resend OTP functionality - connect to backend');
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Verify Your Phone</h1>
          <p className="text-gray-600 dark:text-slate-400">
            We sent a 6-digit code to
          </p>
          <p className="text-gray-900 dark:text-slate-100 font-medium mt-1">{phone}</p>
        </div>

        {/* OTP Input Card */}
        <div className="card">
          {/* Success State */}
          {success && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <p className="text-green-600 dark:text-green-400 font-medium">Verification successful!</p>
            </div>
          )}

          {/* OTP Input Boxes */}
          {!success && (
            <>
              <div className="flex gap-2 justify-center mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={loading || success}
                    className={`
                      w-12 h-14 text-center text-xl font-semibold
                      bg-white dark:bg-slate-800 border-2 rounded-lg
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30
                      transition-all duration-200
                      ${digit ? 'border-blue-500' : 'border-gray-200 dark:border-slate-700'}
                      ${error ? 'border-red-500 dark:border-red-400' : ''}
                      disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed
                      text-gray-900 dark:text-slate-100
                    `}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 mb-4">
                  <XCircle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Timer / Resend */}
              <div className="text-center mb-6">
                {!canResend ? (
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Resend code in{' '}
                    <span className="font-medium text-gray-900 dark:text-slate-100">{formatTime(timeLeft)}</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              {/* Verify Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || otp.some(d => !d)}
                className="btn-primary"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  'Verify Code'
                )}
              </button>
            </>
          )}
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-gray-500 dark:text-slate-500 mt-6">
          Didn't receive the code?{' '}
          <a href="#" className="link">Contact support</a>
        </p>
      </div>
    </div>
  );
}
