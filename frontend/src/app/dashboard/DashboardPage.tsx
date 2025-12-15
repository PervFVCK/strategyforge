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
              Ready to backtest your next winning strategy?
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <ActionCard
            icon={<Upload className="w-6 h-6" />}
            title="Upload Data"
            description="Import your trading data"
            onClick={() => navigate('/upload')}
            badge="Phase 2"
            featured
          />
          <ActionCard
            icon={<Play className="w-6 h-6" />}
            title="Run Backtest"
            description="Test your strategy"
            onClick={() => navigate('/backtest')}
            badge="Phase 3"
          />
          <ActionCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="View Results"
            description="Analyze performance"
            onClick={() => navigate('/result')}
            badge="Phase 4"
          />
          <ActionCard
            icon={<Settings className="w-6 h-6" />}
            title="Settings"
            description="Configure your account"
            onClick={() => alert('Coming soon!')}
          />
        </div>

        {/* Phase Progress */}
        <div className="card-premium rounded-2xl p-6 bg-gradient-to-br from-primary/10 to-card border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🚀</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2">
                Phase 2 in Progress! 🔥
              </h3>
              <p className="text-muted-foreground mb-4">
                You can now upload and parse trading data files. Click "Upload Data" above to get started!
              </p>
              <div className="space-y-2">
                <PhaseStep completed text="User authentication system" />
                <PhaseStep completed text="Beautiful dashboard UI" />
                <PhaseStep active text="File upload & parsing (You are here!)" />
                <PhaseStep text="Backtesting engine" />
                <PhaseStep text="Strategy builder" />
              </div>
            </div>
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
