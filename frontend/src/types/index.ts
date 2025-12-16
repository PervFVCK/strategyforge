
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  isPro: boolean
  isVerified: boolean
  lastLoginAt?: string
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

export interface MagicLinkResponse {
  success: boolean
  message: string
  data: {
    email: string
    expiresAt: string
  }
}



// ============================================
// FILE UPLOAD TYPES
// ============================================

export interface CandleData {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface UploadedFileInfo {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  pair: string
  timeframe: string
  recordCount: number
  startDate: string
  endDate: string
  uploadedAt: string
  processingTime: string
}

export interface UploadResponse {
  success: boolean
  message: string
  data: {
    fileInfo: UploadedFileInfo
    sample: CandleData[]
    total: number
  }
}

// ============================================
// BACKTEST TYPES
// ============================================

export type StrategyType =
  | 'SMA_CROSSOVER'
  | 'EMA_CROSSOVER'
  | 'RSI'
  | 'MACD'
  | 'BOLLINGER_BANDS'
  | 'CUSTOM'

export interface StrategyParameters {
  [key: string]: number
}

export interface BacktestRequest {
  strategy: StrategyType
  parameters: StrategyParameters
  initialBalance: number
  riskPerTrade: number
  data: CandleData[]
}

export interface Trade {
  id: number
  type: 'BUY' | 'SELL'
  entryPrice: number
  exitPrice: number
  entryTime: string
  exitTime: string
  profit: number
  profitPct: number
  size: number
  stopLoss?: number
  takeProfit?: number
}

export interface BacktestSummary {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalProfit: number
  totalLoss: number
  netProfit: number
  profitFactor: number
  maxDrawdown: number
  maxDrawdownPct: number
  sharpeRatio: number
  averageWin: number
  averageLoss: number
  largestWin: number
  largestLoss: number
  initialBalance: number
  finalBalance: number
  returnPct: number
}

export interface EquityPoint {
  time: string
  balance: number
}

export interface DrawdownPoint {
  time: string
  drawdown: number
  drawdownPct: number
}

export interface MonthlyReturn {
  month: string
  return: number
  returnPct: number
}

export interface BacktestResult {
  summary: BacktestSummary
  trades: Trade[]
  equityCurve: EquityPoint[]
  drawdownCurve: DrawdownPoint[]
  monthlyReturns: MonthlyReturn[]
  executionTime: string
}

export interface BacktestResponse {
  success: boolean
  message: string
  data: BacktestResult
}

// ============================================
// CHART TYPES
// ============================================

export interface ChartCrosshairData {
  price: number | null
  time: string | null
}

export interface ChartTooltip {
  visible: boolean
  x: number
  y: number
  data: {
    time: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  } | null
}

// ============================================
// API ERROR TYPES
// ============================================

export interface ApiError {
  error: string
  message: string
  code?: number
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

// ============================================
// REPLAY TYPES (Phase 3)
// ============================================

export interface ReplayState {
  isPlaying: boolean
  speed: number // 0.5x, 1x, 2x, 5x, 10x, 50x, 100x
  currentIndex: number
  totalCandles: number
  currentTime: string
  startTime: string
  endTime: string
}

export interface ReplayControls {
  play: () => void
  pause: () => void
  reset: () => void
  setSpeed: (speed: number) => void
  jumpTo: (index: number) => void
  stepForward: () => void
  stepBackward: () => void
}

// ============================================
// STORE TYPES
// ============================================

export interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  accessToken: string | null
  refreshToken: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  checkAuth: () => void
}

export interface ChartStore {
  candleData: CandleData[]
  selectedTimeframe: string
  selectedPair: string
  isLoading: boolean
  setCandleData: (data: CandleData[]) => void
  setTimeframe: (timeframe: string) => void
  setPair: (pair: string) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export interface BacktestStore {
  currentResult: BacktestResult | null
  isRunning: boolean
  history: BacktestResult[]
  setResult: (result: BacktestResult) => void
  setRunning: (running: boolean) => void
  addToHistory: (result: BacktestResult) => void
  clearHistory: () => void
  reset: () => void
}

// ============================================
// UTILITY TYPES
// ============================================

export type Timeframe =
  | 'M1'
  | 'M5'
  | 'M15'
  | 'M30'
  | 'H1'
  | 'H4'
  | 'D1'
  | 'W1'
  | 'MN1'

export type CurrencyPair =
  | 'EURUSD'
  | 'GBPUSD'
  | 'USDJPY'
  | 'USDCHF'
  | 'AUDUSD'
  | 'USDCAD'
  | 'NZDUSD'
  | 'EURJPY'
  | 'GBPJPY'
  | 'EURGBP'
  | string // Allow custom pairs

export interface PairInfo {
  symbol: string
  name: string
  digits: number
  pipValue: number
  minLot: number
  maxLot: number
  lotStep: number
}

// ============================================
// COMPONENT PROP TYPES
// ============================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export interface CardProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  featured?: boolean
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

// ============================================
// CONSTANTS
// ============================================

export const SUPPORTED_TIMEFRAMES: Timeframe[] = [
  'M1',
  'M5',
  'M15',
  'M30',
  'H1',
  'H4',
  'D1',
  'W1',
  'MN1',
]

export const MAJOR_PAIRS: CurrencyPair[] = [
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'USDCHF',
  'AUDUSD',
  'USDCAD',
  'NZDUSD',
]

export const REPLAY_SPEEDS = [0.5, 1, 2, 5, 10, 25, 50, 100]

export const STRATEGY_TYPES: { value: StrategyType; label: string }[] = [
  { value: 'SMA_CROSSOVER', label: 'SMA Crossover' },
  { value: 'EMA_CROSSOVER', label: 'EMA Crossover' },
  { value: 'RSI', label: 'RSI Strategy' },
  { value: 'MACD', label: 'MACD Strategy' },
  { value: 'BOLLINGER_BANDS', label: 'Bollinger Bands' },
]
