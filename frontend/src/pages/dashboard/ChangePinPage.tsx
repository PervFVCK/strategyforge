import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

export default function ChangePinPage() {
  const navigate = useNavigate();
  const [currentPin, setCurrentPin] = useState(['', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePinChange = (index: number, value: string, pinType: 'current' | 'new' | 'confirm') => {
    if (value && !/^\d+$/.test(value)) return;

    const setPin = pinType === 'current' ? setCurrentPin : pinType === 'new' ? setNewPin : setConfirmPin;
    const pin = pinType === 'current' ? currentPin : pinType === 'new' ? newPin : confirmPin;

    const newPinArray = [...pin];
    newPinArray[index] = value.slice(-1);
    setPin(newPinArray);

    // Auto-focus next or submit
    if (value && index < 3) {
      document.getElementById(`${pinType}-pin-${index + 1}`)?.focus();
    } else if (value && index === 3) {
      if (pinType === 'current') {
        setStep('new');
        setTimeout(() => document.getElementById('new-pin-0')?.focus(), 100);
      } else if (pinType === 'new') {
        setStep('confirm');
        setTimeout(() => document.getElementById('confirm-pin-0')?.focus(), 100);
      } else if (pinType === 'confirm') {
        handleSubmit(currentPin.join(''), newPin.join(''), newPinArray.join(''));
      }
    }
  };

  const handleSubmit = async (current: string, newP: string, confirm: string) => {
    if (newP !== confirm) {
      setError('PINs do not match');
      setConfirmPin(['', '', '', '']);
      setTimeout(() => document.getElementById('confirm-pin-0')?.focus(), 100);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/user/change-pin', {
        current_pin: current,
        new_pin: newP,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/settings'), 2000);
      } else {
        setError(response.data.error || 'Failed to change PIN');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change PIN');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <CheckCircle2 size={64} className="text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">PIN Changed!</h2>
            <p className="text-gray-600 dark:text-slate-400">Redirecting...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-900 dark:text-slate-100" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Change PIN</h1>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {step === 'current' && 'Enter current PIN'}
              {step === 'new' && 'Enter new PIN'}
              {step === 'confirm' && 'Confirm new PIN'}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex gap-3 justify-center mb-6">
            {(step === 'current' ? currentPin : step === 'new' ? newPin : confirmPin).map((digit, i) => (
              <input
                key={i}
                id={`${step}-pin-${i}`}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(i, e.target.value, step)}
                className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
              />
            ))}
          </div>

          {error && <p className="text-red-600 dark:text-red-400 text-sm text-center mb-4">{error}</p>}
          {loading && <p className="text-center"><Loader2 className="animate-spin mx-auto text-blue-600 dark:text-blue-400" /></p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
