import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Play, Settings, TrendingUp, AlertCircle } from 'lucide-react'
import { api, handleApiError } from '../../lib/api'
import { db } from '../../lib/storage'

interface StrategyConfig {
  id: string
  name: string
  description: string
  parameters: {
    name: string
    label: string
    type: 'number'
    defaultValue: number
    min: number
    max: number
    step: number
  }[]
}

const STRATEGIES: StrategyConfig[] = [
  {
    id: 'SMA_CROSSOVER',
    name: 'SMA Crossover',
    description: 'Buy when fast SMA crosses above slow SMA, sell when it crosses below',
    parameters: [
      { name: 'fastPeriod', label: 'Fast Period', type: 'number', defaultValue: 20, min: 5, max: 100, step: 1 },
      { name: 'slowPeriod', label: 'Slow Period', type: 'number', defaultValue: 50, min: 10, max: 200, step: 1 },
    ]
  },
  {
    id: 'EMA_CROSSOVER',
    name: 'EMA Crossover',
    description: 'Exponential Moving Average crossover strategy',
    parameters: [
      { name: 'fastPeriod', label: 'Fast Period', type: 'number', defaultValue: 12, min: 5, max: 100, step: 1 },
      { name: 'slowPeriod', label: 'Slow Period', type: 'number', defaultValue: 26, min: 10, max: 200, step: 1 },
    ]
  },
  {
    id: 'RSI',
    name: 'RSI Strategy',
    description: 'Buy when RSI crosses above oversold, sell when it crosses below overbought',
    parameters: [
      { name: 'period', label: 'RSI Period', type: 'number', defaultValue: 14, min: 5, max: 50, step: 1 },
      { name: 'oversold', label: 'Oversold Level', type: 'number', defaultValue: 30, min: 10, max: 40, step: 1 },
      { name: 'overbought', label: 'Overbought Level', type: 'number', defaultValue: 70, min: 60, max: 90, step: 1 },
    ]
  },
  {
    id: 'MACD',
    name: 'MACD Strategy',
    description: 'Moving Average Convergence Divergence strategy',
    parameters: [
      { name: 'fastPeriod', label: 'Fast Period', type: 'number', defaultValue: 12, min: 5, max: 50, step: 1 },
      { name: 'slowPeriod', label: 'Slow Period', type: 'number', defaultValue: 26, min: 10, max: 100, step: 1 },
      { name: 'signalPeriod', label: 'Signal Period', type: 'number', defaultValue: 9, min: 5, max: 50, step: 1 },
    ]
  },
]

export default function BacktestPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const fileId = location.state?.fileId

  const [file, setFile] = useState<any>(null)
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyConfig>(STRATEGIES[0])
  const [parameters, setParameters] = useState<Record<string, number>>({})
  const [initialBalance, setInitialBalance] = useState(10000)
  const [riskPerTrade, setRiskPerTrade] = useState(2)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!fileId) {
      navigate('/upload')
      return
    }
    loadFile()
  }, [fileId])

  useEffect(() => {
    // Initialize parameters with defaults
    const defaultParams: Record<string, number> = {}
    selectedStrategy.parameters.forEach(param => {
      defaultParams[param.name] = param.defaultValue
    })
    setParameters(defaultParams)
  }, [selectedStrategy])

  const loadFile = async () => {
    try {
      const fileData = await db.getFile(fileId)
      if (!fileData) {
        setError('File not found')
        return
      }
      setFile(fileData)
    } catch (err) {
      setError('Failed to load file')
      console.error(err)
    }
  }

  const handleRunBacktest = async () => {
    if (!file) return

    setRunning(true)
    setError(null)

    try {
      const response = await api.post('/backtest', {
        strategy: selectedStrategy.id,
        parameters,
        initialBalance,
        riskPerTrade,
        data: file.fullData || file.sampleData || []
      })

      if (response.data.success) {
        // Save backtest result
        const backtestId = `backtest_${Date.now()}`
        await db.saveBacktest({
          id: backtestId,
          fileId: file.id,
          strategy: selectedStrategy.id,
          parameters,
          result: response.data.data,
          createdAt: new Date().toISOString()
        })

        // Navigate to results
        navigate(`/backtest/result/${backtestId}`)
      } else {
        throw new Error('Backtest failed')
      }
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setRunning(false)
    }
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-muted-foreground">Loading file...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate('/upload')} className="btn-ghost mb-4">
            ← Back to Upload
          </button>
          <h1 className="text-3xl font-bold text-gradient-primary mb-2">
            Configure Backtest
          </h1>
          <p className="text-muted-foreground">
            Select a strategy and adjust parameters
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Info */}
            <div className="card-premium rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">📁 Selected File</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="File" value={file.fileName} />
                <InfoItem label="Pair" value={file.pair} />
                <InfoItem label="Timeframe" value={file.timeframe} />
                <InfoItem label="Candles" value={file.recordCount?.toLocaleString() || '0'} />
              </div>
            </div>

            {/* Strategy Selection */}
            <div className="card-premium rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">📊 Select Strategy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {STRATEGIES.map(strategy => (
                  <button
                    key={strategy.id}
                    onClick={() => setSelectedStrategy(strategy)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedStrategy.id === strategy.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-muted/50 border-border hover:border-primary/50'
                    }`}
                  >
                    <h4 className="font-semibold mb-1">{strategy.name}</h4>
                    <p className="text-xs text-muted-foreground">{strategy.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Strategy Parameters */}
            <div className="card-premium rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">⚙️ Strategy Parameters</h3>
              <div className="space-y-4">
                {selectedStrategy.parameters.map(param => (
                  <div key={param.name}>
                    <label className="block text-sm font-medium mb-2">
                      {param.label}: {parameters[param.name] || param.defaultValue}
                    </label>
                    <input
                      type="range"
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      value={parameters[param.name] || param.defaultValue}
                      onChange={(e) => setParameters({
                        ...parameters,
                        [param.name]: Number(e.target.value)
                      })}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{param.min}</span>
                      <span>{param.max}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Management */}
            <div className="card-premium rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">💰 Risk Management</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Initial Balance: ${initialBalance.toLocaleString()}
                  </label>
                  <input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(Number(e.target.value))}
                    className="input-field"
                    min="100"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Risk Per Trade: {riskPerTrade}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={riskPerTrade}
                    onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0.5%</span>
                    <span>10%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Run */}
          <div className="space-y-6">
            <div className="card-premium rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">📋 Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Strategy:</span>
                  <span className="font-medium">{selectedStrategy.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Initial Balance:</span>
                  <span className="font-medium">${initialBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk per Trade:</span>
                  <span className="font-medium">{riskPerTrade}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Points:</span>
                  <span className="font-medium">{file.recordCount?.toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/50 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <button
                onClick={handleRunBacktest}
                disabled={running}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
              >
                {running ? (
                  <>
                    <div className="spinner" />
                    Running Backtest...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Run Backtest
                  </>
                )}
              </button>
            </div>

            {/* Info Box */}
            <div className="card-premium rounded-xl p-6 bg-primary/5 border-primary/20">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                How It Works
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Strategy runs on historical data</li>
                <li>• Simulates real trading conditions</li>
                <li>• Calculates profit/loss for each trade</li>
                <li>• Generates detailed performance metrics</li>
                <li>• Results stored offline forever</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-medium text-sm truncate">{value}</p>
    </div>
  )
}
