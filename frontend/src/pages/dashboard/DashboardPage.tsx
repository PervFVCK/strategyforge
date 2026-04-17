import { Bell, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BalanceCard from '@/components/dashboard/BalanceCard';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { mockUser, mockTransactions } from '@/lib/mock-data';

export default function DashboardPage() {
  const [refreshing, setRefreshing] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <DashboardLayout>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              {getGreeting()}, {mockUser.first_name}! 👋
            </h1>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              Welcome back to PayOM
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw 
                size={20} 
                className={`text-gray-600 dark:text-slate-300 ${refreshing ? 'animate-spin' : ''}`} 
              />
            </button>

            {/* Notifications */}
            <button
              onClick={() => alert('Notifications coming in Phase 3!')}
              className="relative p-2 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              title="Notifications"
            >
              <Bell size={20} className="text-gray-600 dark:text-slate-300" />
              {/* Notification badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <BalanceCard
          balance={mockUser.wallet_balance}
          accountNumber={mockUser.account_number}
          userName={`${mockUser.first_name} ${mockUser.last_name}`}
        />

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Transactions */}
        <RecentTransactions transactions={mockTransactions} />

        {/* Promotional Banner */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-1">Invite Friends, Earn ₦1,000!</h4>
              <p className="text-sm text-white/90">
                Share your referral code and get rewarded
              </p>
            </div>
            <button className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors">
              Invite
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
