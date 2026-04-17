import { useState } from 'react';
import { Filter, Search, Calendar, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockTransactions, Transaction, transactionConfig, TransactionType } from '@/lib/mock-data';

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter transactions
  const filteredTransactions = mockTransactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  // Group by date
  const groupedTransactions = filteredTransactions.reduce((groups, tx) => {
    const date = new Date(tx.date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label: string;
    if (date.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      label = 'This Week';
    } else if (date > new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)) {
      label = 'This Month';
    } else {
      label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric'
    });
  };

  const filterOptions: { value: TransactionType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Transactions' },
    { value: 'send', label: 'Sent' },
    { value: 'receive', label: 'Received' },
    { value: 'airtime', label: 'Airtime' },
    { value: 'data', label: 'Data' },
    { value: 'electricity', label: 'Electricity' },
    { value: 'cable', label: 'Cable TV' },
    { value: 'crypto_buy', label: 'Crypto Buy' },
    { value: 'crypto_sell', label: 'Crypto Sell' },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Transactions</h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                ${showFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700'
                }
              `}
            >
              <Filter size={18} />
              Filter
            </button>

            {filterType !== 'all' && (
              <button
                onClick={() => setFilterType('all')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg"
              >
                Clear filter
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Filter by type</h3>
              <div className="grid grid-cols-2 gap-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterType(option.value);
                      setShowFilters(false);
                    }}
                    className={`
                      p-3 rounded-lg text-sm font-medium transition-colors text-left
                      ${filterType === option.value 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-2 border-blue-500' 
                        : 'bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-slate-200 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-slate-600'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
              No transactions found
            </h3>
            <p className="text-gray-600 dark:text-slate-400 text-sm">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Your transactions will appear here'
              }
            </p>
          </div>
        )}

        {/* Grouped Transactions */}
        {Object.keys(groupedTransactions).length > 0 && (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([group, transactions]) => (
              <div key={group}>
                {/* Group Header */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={16} className="text-gray-400 dark:text-slate-500" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">{group}</h3>
                  <div className="flex-1 border-t border-gray-200 dark:border-slate-700" />
                </div>

                {/* Transaction List */}
                <div className="space-y-2">
                  {transactions.map((tx) => {
                    const config = transactionConfig[tx.type];
                    const isPositive = tx.amount > 0;

                    return (
                      <button
                        key={tx.id}
                        onClick={() => alert(`Transaction details coming soon!\n\nID: ${tx.id}\nAmount: ${formatCurrency(tx.amount)}\nStatus: ${tx.status}`)}
                        className="w-full card flex items-center gap-3 hover:shadow-md dark:hover:bg-slate-700 transition-all"
                      >
                        {/* Icon */}
                        <div className={`
                          w-12 h-12 flex items-center justify-center rounded-full text-xl flex-shrink-0
                          ${isPositive 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : 'bg-gray-100 dark:bg-slate-700'
                          }
                        `}>
                          {config.icon}
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium text-gray-900 dark:text-slate-100 truncate">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                              {formatTime(tx.date)} • {formatDate(tx.date)}
                            </span>
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

                        {/* Amount */}
                        <div className="text-right flex-shrink-0">
                          <p className={`
                            font-semibold
                            ${isPositive 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-900 dark:text-slate-100'
                            }
                          `}>
                            {isPositive ? '+' : '-'}{formatCurrency(tx.amount)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More (placeholder) */}
        {filteredTransactions.length > 0 && (
          <button
            onClick={() => alert('Load more coming in Phase 3!')}
            className="w-full py-3 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 transition-colors"
          >
            Load more transactions
          </button>
        )}
      </div>
    </DashboardLayout>
  );
}
