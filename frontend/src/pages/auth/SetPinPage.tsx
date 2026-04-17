import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SetPinPage() {
  const navigate = useNavigate();
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  const userId = localStorage.getItem('temp_user_id');

  // Focus first input on mount
  useEffect(() => {
    if (step === 'create') {
      inputRefs.current[0]?.focus();
    } else {
      confirmRefs.current[0]?.focus();
    }
  }, [step]);

  // Handle PIN input
  const handlePinChange = (index: number, value: string, isConfirm: boolean = false) => {
    if (value && !/^\d+$/.test(value)) return;

    const currentPin = isConfirm ? confirmPin : pin;
    const setCurrentPin = isConfirm ? setConfirmPin : setPin;
    const refs = isConfirm ? confirmRefs : inputRefs;

    const newPin = [...currentPin];
    newPin[index] = value.slice(-1);
    setCurrentPin(newPin);
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      refs.current[index + 1]?.focus();
    }

    // Auto-move to confirm step or submit
    if (index === 3 && value && newPin.every(d => d !== '')) {
      if (!isConfirm) {
        setTimeout(() => setStep('confirm'), 300);
      } else {
        const pinCode = pin.join('');
        const confirmCode = newPin.join('');
        if (pinCode === confirmCode) {
          handleSubmit(pinCode);
        } else {
          setError('PINs do not match');
          setConfirmPin(['', '', '', '']);
          confirmRefs.current[0]?.focus();
        }
      }
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent, isConfirm: boolean = false) => {
    const currentPin = isConfirm ? confirmPin : pin;
    const refs = isConfirm ? confirmRefs : inputRefs;

    if (e.key === 'Backspace' && !currentPin[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  // Submit PIN to backend
  const handleSubmit = async (pinCode: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(userId || '0'),
          pin: pinCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        
        // Save tokens
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        
        // Clean up temp data
        localStorage.removeItem('temp_phone');
        localStorage.removeItem('temp_user_id');
        
        // Redirect to dashboard
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setError(data.error || 'Failed to set PIN');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Manual verify (if user doesn't auto-submit)
  const handleManualSubmit = () => {
    const pinCode = pin.join('');
    const confirmCode = confirmPin.join('');

    if (pinCode.length !== 4 || confirmCode.length !== 4) {
      setError('Please enter all 4 digits');
      return;
    }

    if (pinCode !== confirmCode) {
      setError('PINs do not match');
      setConfirmPin(['', '', '', '']);
      confirmRefs.current[0]?.focus();
      return;
    }

    handleSubmit(pinCode);
  };

  // Reset and go back to create step
  const handleReset = () => {
    setStep('create');
    setConfirmPin(['', '', '', '']);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        {!success && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <Lock size={28} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            {step === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            {step === 'create' 
              ? 'Set a 4-digit PIN for quick access'
              : 'Enter your PIN again to confirm'
            }
          </p>
        </div>

        {/* PIN Input Card */}
        <div className="card">
          {/* Success State */}
          {success ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                Account Ready!
              </h3>
              <p className="text-gray-600 dark:text-slate-400 mb-4">
                Your PIN has been set successfully
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                <span>Redirecting to dashboard...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Create PIN */}
              {step === 'create' && (
                <div className="mb-6">
                  <div className="flex gap-3 justify-center mb-4">
                    {pin.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => inputRefs.current[index] = el}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handlePinChange(index, e.target.value, false)}
                        onKeyDown={e => handleKeyDown(index, e, false)}
                        disabled={loading}
                        className={`
                          w-14 h-16 text-center text-2xl font-bold
                          bg-white dark:bg-slate-800 border-2 rounded-lg
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30
                          transition-all duration-200
                          ${digit ? 'border-blue-500' : 'border-gray-200 dark:border-slate-700'}
                          disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed
                          text-gray-900 dark:text-slate-100
                        `}
                      />
                    ))}
                  </div>
                  
                  {/* PIN Dots Indicator */}
                  <div className="flex gap-2 justify-center">
                    {pin.map((digit, index) => (
                      <div
                        key={index}
                        className={`
                          w-2 h-2 rounded-full transition-all duration-200
                          ${digit ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-300 dark:bg-slate-600'}
                        `}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Confirm PIN */}
              {step === 'confirm' && (
                <div className="mb-6">
                  <div className="flex gap-3 justify-center mb-4">
                    {confirmPin.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => confirmRefs.current[index] = el}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handlePinChange(index, e.target.value, true)}
                        onKeyDown={e => handleKeyDown(index, e, true)}
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

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 mb-4">
                      <XCircle size={16} />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  {/* Reset Button */}
                  <div className="text-center mb-4">
                    <button
                      onClick={handleReset}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      Change PIN
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button (only show if not auto-submitting) */}
              {step === 'confirm' && (
                <button
                  onClick={handleManualSubmit}
                  disabled={loading || confirmPin.some(d => !d)}
                  className="btn-primary"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      Setting PIN...
                    </span>
                  ) : (
                    'Confirm PIN'
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* Security Note */}
        {!success && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-medium">Security tip:</span> Choose a PIN that's easy for you to remember but hard for others to guess. Avoid using birthdates or sequential numbers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
