import { useAuthStore } from '../../store/authStore'
import { TrendingUp, Upload, Play, BarChart3, Settings, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
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
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/20 to-transparent rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-muted-foreground text-lg mb-4">
              Ready to backtest your next winning strategy?
            </p>
            {!user?.isPro && (
              <div className="inline-flex items-center gap-2 bg-primary-900/30 border border-primary-800/50 rounded-lg px-4 py-2 text-sm">
                <span className="text-primary-300">Free Plan</span>
                <span className="text-muted-foreground">•</span>
                <button className="text-primary-400 hover:text-primary-300 font-medium">
                  Upgrade to Pro →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <ActionCard
            icon={<Upload className="w-6 h-6" />}
            title="Upload Data"
            description="Import your trading data"
            onClick={() => alert('Coming in Phase 2!')}
            badge="Phase 2"
          />
          <ActionCard
            icon={<Play className="w-6 h-6" />}
            title="Run Backtest"
            description="Test your strategy"
            onClick={() => alert('Coming in Phase 3!')}
            badge="Phase 3"
          />
          <ActionCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="View Results"
            description="Analyze performance"
            onClick={() => alert('Coming in Phase 4!')}
            badge="Phase 4"
          />
          <ActionCard
            icon={<Settings className="w-6 h-6" />}
            title="Settings"
            description="Configure your account"
            onClick={() => alert('Coming soon!')}
          />
        </div>

        {/* Phase 1 Complete Banner */}
        <div className="card-premium rounded-2xl p-6 bg-gradient-to-br from-primary-900/20 to-card border-primary-800/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🎉</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">
                Phase 1 Complete! 🚀
              </h3>
              <p className="text-muted-foreground mb-4">
                Authentication system is live. You're now logged in with bank-level security
                (Argon2id password hashing, JWT tokens, rate limiting).
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary-500 rounded-full" />
                  <span className="text-foreground">User registration & login ✅</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary-500 rounded-full" />
                  <span className="text-foreground">JWT authentication ✅</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary-500 rounded-full" />
                  <span className="text-foreground">Protected routes ✅</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary-500 rounded-full" />
                  <span className="text-foreground">Beautiful UI ✅</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 p-6 border border-border rounded-xl bg-card/50">
          <h3 className="text-lg font-bold text-foreground mb-4">🎯 Next: Phase 2 - Data Upload</h3>
          <div className="space-y-3">
            <NextStep number="1" text="Drag-and-drop CSV/HST file upload" />
            <NextStep number="2" text="Parse 20+ years of tick data in <3s (Go backend)" />
            <NextStep number="3" text="Store in IndexedDB for offline access" />
            <NextStep number="4" text="Auto-detect timezone, spread, currency pair" />
          </div>
        </div>
      </div>
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
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  badge?: string
}) {
  return (
    <button
      onClick={onClick}
      className="card-premium rounded-xl p-6 text-left hover:border-primary-700/50 transition-all duration-200 hover:scale-105 active:scale-95 group relative overflow-hidden"
    >
      {badge && (
        <span className="absolute top-3 right-3 text-xs bg-primary-900/50 text-primary-300 px-2 py-1 rounded-full border border-primary-800/50">
          {badge}
        </span>
      )}
      <div className="w-12 h-12 bg-primary-900/50 rounded-xl flex items-center justify-center mb-4 text-primary-400 group-hover:bg-primary-900/70 transition-colors">
        {icon}
      </div>
      <h3 className="font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </button>
  )
}

// Next Step Component
function NextStep({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-primary-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-primary-400">{number}</span>
      </div>
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  )
}
