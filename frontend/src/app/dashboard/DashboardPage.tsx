import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { 
  TrendingUp, Upload, Play, BarChart3, Settings, LogOut, 
  FileText, Clock, Award, Zap, ArrowRight, Activity 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../lib/storage'

interface UploadedFile {
  id: string
  fileName: string
  pair: string
  timeframe: string
  recordCount: number
  uploadedAt: string
}

interface BacktestResult {
  id: string
  strategy: string
  createdAt: string
  result: {
    summary: {
      netProfit: number
      returnPct: number
      winRate: number
      totalTrades: number
    }
  }
}

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [recentFiles, setRecentFiles] = useState<UploadedFile[]>([])
  const [recentBacktests, setRecentBacktests] = useState<BacktestResult[]>([])
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalBacktests: 0,
    totalProfit: 0,
    avgWinRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load files
      const files = await db.getAllFiles()
      setRecentFiles(files.slice(-5).reverse()) // Last 5 files

      // Load backtests
      const backtests = await db.getAllBacktests()
      setRecentBacktests(backtests.slice(-5).reverse()) // Last 5 backtests

      // Calculate stats
      const totalProfit = backtests.reduce(
        (sum, bt) => sum + (bt.result?.summary?.netProfit || 0),
        0
      )
      const avgWinRate = backtests.length > 0
        ? backtests.reduce((sum, bt) => sum + (bt.result?.summary?.winRate || 0), 0) / backtests.length
        : 0

      setStats({
        totalFiles: files.length,
        totalBacktests: backtests.length,
        totalProfit,
        avgWinRate,
      })
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">StrategyForge</h1>
                <p className="text-xs text-muted-foreground">Africa Edition</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn-ghost flex items-center gap-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="card-premium rounded-2xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-muted-foreground text-lg mb-4">
              {stats.totalBacktests === 0 
                ? "Ready to run your first backtest?" 
                : `You've run ${stats.totalBacktests} backtests so far!`}
            </p>
            {!user?.isPro && (
              <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-lg px-4 py-2 text-sm">
                <span className="text-primary">Free Plan</span>
                <span className="text-muted-foreground">•</span>
                <button className="text-primary hover:text-primary/80 font-medium">
                  Upgrade to Pro →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        {!loading && stats.totalBacktests > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<FileText className="w-5 h-5" />}
              label="Files Uploaded"
              value={stats.totalFiles.toString()}
              color="primary"
            />
            <StatCard
              icon={<Activity className="w-5 h-5" />}
              label="Backtests Run"
              value={stats.totalBacktests.toString()}
              color="primary"
            />
            <StatCard
              icon={<Award className="w-5 h-5" />}
              label="Total Profit"
              value={`$${Math.abs(stats.totalProfit).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              color={stats.totalProfit >= 0 ? 'green' : 'red'}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Avg Win Rate"
              value={`${stats.avgWinRate.toFixed(1)}%`}
              color="primary"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <ActionCard
            icon={<Upload className="w-6 h-6" />}
            title="Upload Data"
            description="Import CSV, HST, or BIN files"
            onClick={() => navigate('/upload')}
            badge="Phase 2"
            featured
          />
          <ActionCard
            icon={<Play className="w-6 h-6" />}
            title="Run Backtest"
            description="Test your trading strategy"
            onClick={() => {
              if (stats.totalFiles === 0) {
                alert('Upload a data file first!')
                navigate('/upload')
              } else {
                navigate('/backtest')
              }
            }}
            badge="Phase 3"
            featured
          />
          <ActionCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="View Results"
            description="See your latest backtest"
            onClick={() => {
              if (recentBacktests.length > 0) {
                navigate(`/backtest/result/${recentBacktests[0].id}`)
              } else {
                alert('No backtests yet! Run one first.')
              }
            }}
            badge="Phase 3"
          />
          <ActionCard
            icon={<Settings className="w-6 h-6" />}
            title="Settings"
            description="Configure your account"
            onClick={() => alert('Settings coming in Phase 8!')}
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Files */}
          <div className="card-premium rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Recent Files
              </h3>
              <button
                onClick={() => navigate('/upload')}
                className="text-sm text-primary hover:text-primary/80"
              >
                View All →
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner" />
              </div>
            ) : recentFiles.length > 0 ? (
              <div className="space-y-3">
                {recentFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => navigate('/backtest', { state: { fileId: file.id } })}
                    className="w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm truncate">{file.fileName}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="px-2 py-0.5 bg-primary/20 text-primary rounded">
                            {file.pair}
                          </span>
                          <span>{file.timeframe}</span>
                          <span>{file.recordCount?.toLocaleString()} candles</span>
                        </div>
                      </div>
                      <Clock className="w-4 h-4 text-muted-foreground ml-2" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(file.uploadedAt)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground mb-4">No files uploaded yet</p>
                <button
                  onClick={() => navigate('/upload')}
                  className="btn-primary btn-sm"
                >
                  Upload Your First File
                </button>
              </div>
            )}
          </div>

          {/* Recent Backtests */}
          <div className="card-premium rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Recent Backtests
              </h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="spinner" />
              </div>
            ) : recentBacktests.length > 0 ? (
              <div className="space-y-3">
                {recentBacktests.map((backtest) => {
                  const isProfit = backtest.result?.summary?.netProfit >= 0
                  return (
                    <button
                      key={backtest.id}
                      onClick={() => navigate(`/backtest/result/${backtest.id}`)}
                      className="w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{backtest.strategy.replace('_', ' ')}</span>
                        <span className={`text-sm font-semibold ${isProfit ? 'text-primary' : 'text-destructive'}`}>
                          {isProfit ? '+' : ''}{backtest.result?.summary?.returnPct?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{backtest.result?.summary?.totalTrades} trades</span>
                        <span>•</span>
                        <span>{backtest.result?.summary?.winRate?.toFixed(0)}% win rate</span>
                        <span>•</span>
                        <span>{formatDate(backtest.createdAt)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Play className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground mb-4">No backtests yet</p>
                <button
                  onClick={() => {
                    if (stats.totalFiles === 0) {
                      alert('Upload a file first!')
                      navigate('/upload')
                    } else {
                      navigate('/backtest')
                    }
                  }}
                  className="btn-primary btn-sm"
                >
                  Run Your First Backtest
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Phase Progress */}
        <div className="card-premium rounded-2xl p-6 bg-gradient-to-br from-primary/10 to-card border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🚀</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">
                Phase 3 Complete! 🔥
              </h3>
              <p className="text-muted-foreground mb-4">
                You now have live charts, equity curves, and full backtesting! Upload data and see real results.
              </p>
              <div className="space-y-2">
                <PhaseStep completed text="Authentication system" />
                <PhaseStep completed text="Beautiful dashboard UI" />
                <PhaseStep completed text="File upload & parsing" />
                <PhaseStep completed text="Backtesting engine (SMA, EMA, RSI, MACD)" />
                <PhaseStep completed text="Live charts with TradingView library" />
                <PhaseStep active text="Bar Replay Pro (Phase 5 coming soon!)" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color = 'primary',
}: {
  icon: React.ReactNode
  label: string
  value: string
  color?: 'primary' | 'green' | 'red'
}) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    green: 'text-green-500 bg-green-500/10 border-green-500/20',
    red: 'text-red-500 bg-red-500/10 border-red-500/20',
  }

  return (
    <div className={`card-premium rounded-xl p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={colorClasses[color].split(' ')[0]}>
          {icon}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

// Action Card Component
function ActionCard({
  icon,
  title,
  description,
  onClick,
  badge,
  featured,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  badge?: string
  featured?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`card-premium rounded-xl p-6 text-left transition-all duration-200 hover:scale-105 active:scale-95 group relative overflow-hidden ${
        featured ? 'border-primary/50' : ''
      }`}
    >
      {badge && (
        <span className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full border ${
          featured 
            ? 'bg-primary/20 text-primary border-primary/30' 
            : 'bg-muted text-muted-foreground border-border'
        }`}>
          {badge}
        </span>
      )}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
        featured 
          ? 'bg-primary/20 text-primary group-hover:bg-primary/30' 
          : 'bg-muted text-muted-foreground group-hover:bg-muted/70'
      }`}>
        {icon}
      </div>
      <h3 className="font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </button>
  )
}

// Phase Step Component
function PhaseStep({ completed, active, text }: { completed?: boolean; active?: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
        completed 
          ? 'bg-primary text-white' 
          : active 
          ? 'bg-primary/30 border-2 border-primary' 
          : 'bg-muted border-2 border-border'
      }`}>
        {completed && <span className="text-sm">✓</span>}
        {active && <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />}
      </div>
      <span className={`text-sm ${completed || active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
        {text}
      </span>
    </div>
  )
}
