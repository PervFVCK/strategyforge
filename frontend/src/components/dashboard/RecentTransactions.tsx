import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Transaction, transactionConfig } from '@/lib/mock-data';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const navigate = useNavigate();
  
  // Show only 3 most recent
  const recentTxs = transactions.slice(0, 3);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (recentTxs.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Recent Transactions</h3>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-8 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-600 dark:text-slate-400 text-sm">No transactions yet</p>
          <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">Your transactions will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Recent Transactions</h3>
        <button
          onClick={() => navigate('/transactions')}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          View All
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {recentTxs.map((tx, index) => {
          const config = transactionConfig[tx.type];
          const isPositive = tx.amount > 0;

          return (
            <div
              key={tx.id}
              className={`
                flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer
                ${index !== recentTxs.length - 1 ? 'border-b border-gray-100 dark:border-slate-700' : ''}
              `}
              onClick={() => navigate('/transactions')}
            >
              {/* Left side: Icon + Info */}
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={`
                  w-10 h-10 flex items-center justify-center rounded-full text-lg
                  ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-slate-700'}
                `}>
                  {config.icon}
                </div>

                {/* Description */}
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100 text-sm">
                    {tx.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {formatTime(tx.date)}
                  </p>
                </div>
              </div>

              {/* Right side: Amount */}
              <div className="text-right">
                <p className={`
                  font-semibold text-sm
                  ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-slate-100'}
                `}>
                  {isPositive ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
                <span className={`
                  inline-block px-2 py-0.5 rounded-full text-xs font-medium
                  ${tx.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''}
                  ${tx.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : ''}
                  ${tx.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : ''}
                `}>
                  {tx.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
