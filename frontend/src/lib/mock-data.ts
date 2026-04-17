export const mockUser = {
  id: 1,
  first_name: 'Emmanuel',
  last_name: 'Okafor',
  email: 'test@payom.com',
  phone: '08012345678',
  wallet_balance: 50000.00,
  account_number: '1012345678',
  is_verified: true,
  created_at: '2026-01-15T10:30:00Z',
};

export type TransactionType = 'send' | 'receive' | 'airtime' | 'data' | 'electricity' | 'cable' | 'crypto_buy' | 'crypto_sell';

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  reference?: string;
  recipient?: string;
}

export const mockTransactions: Transaction[] = [
  {
    id: 'txn_001',
    type: 'receive',
    description: 'Payment from John Doe',
    amount: 15000,
    status: 'completed',
    date: '2026-01-23T09:30:00Z',
    recipient: 'John Doe',
  },
  {
    id: 'txn_002',
    type: 'send',
    description: 'Transfer to Jane Smith',
    amount: -5000,
    status: 'completed',
    date: '2026-01-23T08:15:00Z',
    recipient: 'Jane Smith',
  },
  {
    id: 'txn_003',
    type: 'airtime',
    description: 'MTN Airtime',
    amount: -500,
    status: 'completed',
    date: '2026-01-22T18:45:00Z',
  },
  {
    id: 'txn_004',
    type: 'electricity',
    description: 'IKEDC Prepaid',
    amount: -3000,
    status: 'completed',
    date: '2026-01-22T14:20:00Z',
  },
  {
    id: 'txn_005',
    type: 'data',
    description: 'Airtel Data Bundle',
    amount: -1500,
    status: 'completed',
    date: '2026-01-22T10:00:00Z',
  },
  {
    id: 'txn_006',
    type: 'receive',
    description: 'Salary Payment',
    amount: 150000,
    status: 'completed',
    date: '2026-01-21T00:00:00Z',
    recipient: 'PayOM Ltd',
  },
  {
    id: 'txn_007',
    type: 'send',
    description: 'Transfer to Sarah Johnson',
    amount: -25000,
    status: 'completed',
    date: '2026-01-20T16:30:00Z',
    recipient: 'Sarah Johnson',
  },
  {
    id: 'txn_008',
    type: 'cable',
    description: 'DStv Subscription',
    amount: -8500,
    status: 'completed',
    date: '2026-01-20T12:00:00Z',
  },
  {
    id: 'txn_009',
    type: 'crypto_buy',
    description: 'Buy Bitcoin',
    amount: -50000,
    status: 'completed',
    date: '2026-01-19T09:00:00Z',
  },
  {
    id: 'txn_010',
    type: 'send',
    description: 'Transfer to Michael Brown',
    amount: -10000,
    status: 'completed',
    date: '2026-01-18T15:45:00Z',
    recipient: 'Michael Brown',
  },
  {
    id: 'txn_011',
    type: 'airtime',
    description: 'Glo Airtime',
    amount: -200,
    status: 'pending',
    date: '2026-01-18T11:20:00Z',
  },
  {
    id: 'txn_012',
    type: 'receive',
    description: 'Refund from PayOM',
    amount: 2500,
    status: 'completed',
    date: '2026-01-17T13:00:00Z',
  },
];

// Transaction type icons and colors
export const transactionConfig: Record<TransactionType, { icon: string; color: string; label: string }> = {
  send: { icon: '↑', color: 'text-red-600', label: 'Sent' },
  receive: { icon: '↓', color: 'text-green-600', label: 'Received' },
  airtime: { icon: '📱', color: 'text-blue-600', label: 'Airtime' },
  data: { icon: '📶', color: 'text-purple-600', label: 'Data' },
  electricity: { icon: '⚡', color: 'text-yellow-600', label: 'Electricity' },
  cable: { icon: '📺', color: 'text-indigo-600', label: 'Cable TV' },
  crypto_buy: { icon: '🪙', color: 'text-orange-600', label: 'Crypto Buy' },
  crypto_sell: { icon: '💰', color: 'text-emerald-600', label: 'Crypto Sell' },
};

// Quick actions configuration
export const quickActions = [
  { id: 'send', label: 'Send Money', icon: '💸', path: '/send', color: 'bg-blue-500' },
  { id: 'bills', label: 'Pay Bills', icon: '📱', path: '/bills', color: 'bg-purple-500' },
  { id: 'crypto', label: 'Buy Crypto', icon: '🪙', path: '/crypto', color: 'bg-orange-500' },
  { id: 'savings', label: 'Savings', icon: '💰', path: '/savings', color: 'bg-green-500' },
  { id: 'cards', label: 'Cards', icon: '💳', path: '/cards', color: 'bg-pink-500' },
  { id: 'stats', label: 'Analytics', icon: '📊', path: '/analytics', color: 'bg-indigo-500' },
];
