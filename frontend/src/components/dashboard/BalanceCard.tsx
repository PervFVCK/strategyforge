import { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  accountNumber: string;
  userName: string;
}

export default function BalanceCard({ balance, accountNumber, userName }: BalanceCardProps) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 dark:from-blue-700 dark:via-blue-800 dark:to-blue-950 p-6 shadow-lg">
      {/* Decorative circles */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 dark:bg-white/5" />
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 dark:bg-white/5" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-blue-100 dark:text-blue-200 text-sm font-medium">Total Balance</p>
          </div>
          <button
            onClick={() => setBalanceVisible(!balanceVisible)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
          >
            {balanceVisible ? (
              <Eye size={20} className="text-white" />
            ) : (
              <EyeOff size={20} className="text-white" />
            )}
          </button>
        </div>

        {/* Balance */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white tracking-tight">
            {balanceVisible ? formatCurrency(balance) : '₦••••••'}
          </h2>
        </div>

        {/* Account Info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 dark:text-blue-200 text-xs mb-1">Account Number</p>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono font-semibold text-lg tracking-wider">
                {accountNumber}
              </span>
              <button
                onClick={copyAccountNumber}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 transition-all"
                title="Copy account number"
              >
                {copied ? (
                  <Check size={14} className="text-green-300 dark:text-green-400" />
                ) : (
                  <Copy size={14} className="text-white" />
                )}
              </button>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-blue-100 dark:text-blue-200 text-xs mb-1">Account Name</p>
            <p className="text-white font-semibold">{userName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
