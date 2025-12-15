import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TrendingUp, TrendingDown, Award, AlertTriangle, Download, Share2 } from 'lucide-react'
import { db } from '../../lib/storage'

interface BacktestResult {
  summary: {
    totalTrades: number
    winningTrades: number
    losingTrades: number
    winRate: number
    netProfit: number
    profitFactor: number
    maxDrawdown: number
    maxDrawdownPct: number
    sharpeRatio: number
    initialBalance: number
    finalBalance: number
    returnPct: number
    averageWin: number
    averageLoss: number
    largestWin: number
    largestLoss: number
  }
  trades: any[]
  equityCurve: any[]
  executionTime: string
}

export default function ResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResult()
  }, [id])

  const loadResult = async () => {
    try {
      const backtest = await db.getBacktest(id!)
      if (!backtest) {
        navigate('/upload')
        return
      }
      setResult(backtest.result)
    } catch (err) {
      console.error('Failed to load result:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Results Not Found</h2>
          <button onClick={() => navigate('/upload')} className="btn-primary mt-4">
            Back to Upload
          </button>
        </div>
      </div>
    )
  }

  const { summary } = result
  const isProfit = summary.netProfit > 0

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate('/backtest')} className="btn-ghost mb-4">
            ← Run Another Backtest
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gradient-primary mb-2">
                Backtest Results
              </h1>
              <p className="text-muted-foreground">
                Completed in {result.executionTime}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button className="btn-secondary flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Performance Banner */}
        <div className={`card-premium rounded-2xl p-8 mb-8 relative overflow-hidden ${
          isProfit ? 'border-primary/50' : 'border-destructive/50'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Net Profit</p>
              <p className={`text-4xl font-bold ${isProfit ? 'text-primary' : 'text-destructive'}`}>
                {isProfit ? '+' : ''}{summary.netProfit >= 0 ? '$' : '-$'}
                {Math.abs(summary.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className={`text-sm mt-1 ${isProfit ? 'text-primary' : 'text-destructive'}`}>
                {summary.returnPct >= 0 ? '+' : ''}{summary.returnPct.toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Win Rate</p>
              <p className="text-4xl font-bold text-foreground">
                {summary.winRate.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {summary.winningTrades}W / {summary.losingTrades}L
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Profit Factor</p>
              <p className="text-4xl font-bold text-foreground">
                {summary.profitFactor.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {summary.totalTrades} total trades
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            icon={<Award className="w-5 h-5" />}
            label="Sharpe Ratio"
            value={summary.sharpeRatio.toFixed(2)}
            positive={summary.sharpeRatio > 1}
          />
          <MetricCard
            icon={<TrendingDown className="w-5 h-5" />}
            label="Max Drawdown"
            value={`${summary.maxDrawdownPct.toFixed(2)}%`}
            positive={false}
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Average Win"
            value={`$${summary.averageWin.toFixed(2)}`}
            positive={true}
          />
          <MetricCard
            icon={<TrendingDown className="w-5 h-5" />}
            label="Average Loss"
            value={`$${Math.abs(summary.averageLoss).toFixed(2)}`}
            positive={false}
          />
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Account Performance */}
          <div className="card-premium rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">💰 Account Performance</h3>
            <div className="space-y-3">
              <StatRow label="Initial Balance" value={`$${summary.initialBalance.toLocaleString()}`} />
              <StatRow label="Final Balance" value={`$${summary.finalBalance.toLocaleString()}`} />
              <StatRow 
                label="Net Profit/Loss" 
                value={`${summary.netProfit >= 0 ? '+$' : '-$'}${Math.abs(summary.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                highlight={summary.netProfit >= 0 ? 'positive' : 'negative'}
              />
              <StatRow 
                label="Return" 
                value={`${summary.returnPct >= 0 ? '+' : ''}${summary.returnPct.toFixed(2)}%`}
                highlight={summary.returnPct >= 0 ? 'positive' : 'negative'}
              />
            </div>
          </div>

          {/* Trade Statistics */}
          <div className="card-premium rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">📊 Trade Statistics</h3>
            <div className="space-y-3">
              <StatRow label="Total Trades" value={summary.totalTrades.toString()} />
              <StatRow label="Winning Trades" value={`${summary.winningTrades} (${summary.winRate.toFixed(1)}%)`} />
              <StatRow label="Losing Trades" value={`${summary.losingTrades} (${(100 - summary.winRate).toFixed(1)}%)`} />
              <StatRow label="Largest Win" value={`$${summary.largestWin.toFixed(2)}`} />
              <StatRow label="Largest Loss" value={`$${Math.abs(summary.largestLoss).toFixed(2)}`} />
            </div>
          </div>
        </div>

        {/* Trade History */}
        <div className="card-premium rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">📝 Recent Trades (Last 10)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">#</th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Type</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Entry</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Exit</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Profit</th>
                  <th className="text-right py-3 px-2 text-muted-foreground font-medium">Return</th>
                </tr>
              </thead>
              <tbody>
                {result.trades.slice(-10).reverse().map((trade, idx) => (
                  <tr key={trade.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-3 px-2">#{trade.id}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        trade.type === 'BUY' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
                      }`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-mono">${trade.entryPrice.toFixed(5)}</td>
                    <td className="py-3 px-2 text-right font-mono">${trade.exitPrice.toFixed(5)}</td>
                    <td className={`py-3 px-2 text-right font-semibold ${
                      trade.profit >= 0 ? 'text-primary' : 'text-destructive'
                    }`}>
                      {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                    </td>
                    <td className={`py-3 px-2 text-right ${
                      trade.profitPct >= 0 ? 'text-primary' : 'text-destructive'
                    }`}>
                      {trade.profitPct >= 0 ? '+' : ''}{trade.profitPct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.trades.length > 10 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Showing last 10 of {result.trades.length} trades
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => navigate('/backtest')}
            className="btn-primary flex-1"
          >
            Run Another Backtest
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="btn-secondary flex-1"
          >
            Upload New Data
          </button>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  positive 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  positive: boolean
}) {
  return (
    <div className="card-premium rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`${positive ? 'text-primary' : 'text-destructive'}`}>
          {icon}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  )
}

function StatRow({ 
  label, 
  value, 
  highlight 
}: { 
  label: string
  value: string
  highlight?: 'positive' | 'negative'
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${
        highlight === 'positive' ? 'text-primary' : 
        highlight === 'negative' ? 'text-destructive' : 
        'text-foreground'
      }`}>
        {value}
      </span>
    </div>
  )
}
