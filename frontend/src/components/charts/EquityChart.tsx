import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts'

interface EquityPoint {
  time: string
  balance: number
}

interface DrawdownPoint {
  time: string
  drawdown: number
  drawdownPct: number
}

interface EquityChartProps {
  equityCurve: EquityPoint[]
  drawdownCurve?: DrawdownPoint[]
  height?: number
  showDrawdown?: boolean
  autoSize?: boolean
  initialBalance?: number
}

export default function EquityChart({
  equityCurve,
  drawdownCurve,
  height = 400,
  showDrawdown = false,
  autoSize = true,
  initialBalance = 10000,
}: EquityChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const equitySeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const drawdownSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    currentBalance: 0,
    profit: 0,
    profitPct: 0,
    maxDrawdown: 0,
  })

  useEffect(() => {
    // Validation
    if (!chartContainerRef.current) {
      console.error('Chart container ref is null')
      setError('Chart container not ready')
      setIsLoading(false)
      return
    }

    if (!equityCurve || equityCurve.length === 0) {
      console.error('No equity curve data')
      setError('No equity data available')
      setIsLoading(false)
      return
    }

    console.log('📊 Creating equity chart with', equityCurve.length, 'points')

    try {
      // Create chart
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { color: 'transparent' },
          textColor: '#9CA3AF',
        },
        grid: {
          vertLines: { color: '#1F2937' },
          horzLines: { color: '#1F2937' },
        },
        width: chartContainerRef.current.clientWidth,
        height: height,
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: '#374151',
        },
        rightPriceScale: {
          borderColor: '#374151',
          scaleMargins: {
            top: 0.1,
            bottom: showDrawdown ? 0.5 : 0.1,
          },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: '#10B981',
            width: 1,
            style: 3,
            labelBackgroundColor: '#10B981',
          },
          horzLine: {
            color: '#10B981',
            width: 1,
            style: 3,
            labelBackgroundColor: '#10B981',
          },
        },
      })

      chartRef.current = chart

      // Add equity line series
      const equitySeries = chart.addLineSeries({
        color: '#10B981',
        lineWidth: 2,
        priceLineVisible: true,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        title: 'Equity',
      })

      equitySeriesRef.current = equitySeries

      // Add drawdown series if enabled
      if (showDrawdown && drawdownCurve && drawdownCurve.length > 0) {
        const drawdownSeries = chart.addLineSeries({
          color: '#EF4444',
          lineWidth: 2,
          priceFormat: {
            type: 'percent',
          },
          priceScaleId: 'left',
          title: 'Drawdown',
        })

        chart.priceScale('left').applyOptions({
          scaleMargins: {
            top: 0.6,
            bottom: 0,
          },
          borderColor: '#374151',
        })

        drawdownSeriesRef.current = drawdownSeries
      }

      // Convert data to Lightweight Charts format with validation
      const equityData: LineData[] = []
      
      for (const point of equityCurve) {
        try {
          const timestamp = new Date(point.time).getTime() / 1000
          if (isNaN(timestamp) || !isFinite(point.balance)) {
            console.warn('Invalid data point:', point)
            continue
          }
          equityData.push({
            time: timestamp as Time,
            value: point.balance,
          })
        } catch (err) {
          console.error('Error parsing equity point:', point, err)
        }
      }

      if (equityData.length === 0) {
        throw new Error('No valid equity data points after parsing')
      }

      console.log('✅ Parsed', equityData.length, 'valid equity points')
      equitySeries.setData(equityData)

      // Handle drawdown data
      if (showDrawdown && drawdownCurve && drawdownSeriesRef.current) {
        const drawdownData: LineData[] = []
        
        for (const point of drawdownCurve) {
          try {
            const timestamp = new Date(point.time).getTime() / 1000
            if (isNaN(timestamp) || !isFinite(point.drawdownPct)) {
              continue
            }
            drawdownData.push({
              time: timestamp as Time,
              value: -point.drawdownPct,
            })
          } catch (err) {
            console.error('Error parsing drawdown point:', point, err)
          }
        }
        
        if (drawdownData.length > 0) {
          drawdownSeriesRef.current.setData(drawdownData)
        }
      }

      // Calculate stats
      if (equityCurve.length > 0) {
        const lastPoint = equityCurve[equityCurve.length - 1]
        const profit = lastPoint.balance - initialBalance
        const profitPct = (profit / initialBalance) * 100
        const maxDD = drawdownCurve && drawdownCurve.length > 0
          ? Math.max(...drawdownCurve.map((d) => d.drawdownPct))
          : 0

        setStats({
          currentBalance: lastPoint.balance,
          profit,
          profitPct,
          maxDrawdown: maxDD,
        })
      }

      // Fit content
      chart.timeScale().fitContent()
      setIsLoading(false)
      console.log('✅ Equity chart created successfully')

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && autoSize) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
          })
        }
      }

      if (autoSize) {
        window.addEventListener('resize', handleResize)
      }

      // Cleanup
      return () => {
        if (autoSize) {
          window.removeEventListener('resize', handleResize)
        }
        chart.remove()
      }
    } catch (err) {
      console.error('❌ Error creating equity chart:', err)
      setError(err instanceof Error ? err.message : 'Chart creation failed')
      setIsLoading(false)
    }
  }, [equityCurve, drawdownCurve, height, showDrawdown, autoSize, initialBalance])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  if (error) {
    return (
      <div className="relative w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard label="Current Balance" value={formatCurrency(stats.currentBalance)} />
          <StatCard label="Total Profit" value={formatCurrency(stats.profit)} isProfit={stats.profit >= 0} />
          <StatCard label="Return" value={`${stats.profitPct >= 0 ? '+' : ''}${stats.profitPct.toFixed(2)}%`} isProfit={stats.profitPct >= 0} />
          <StatCard label="Max Drawdown" value={`${stats.maxDrawdown.toFixed(2)}%`} isDanger={stats.maxDrawdown > 20} />
        </div>
        <div className="relative w-full bg-card rounded-xl border border-destructive/50 overflow-hidden p-8 text-center">
          <p className="text-destructive mb-2">Chart Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard
          label="Current Balance"
          value={formatCurrency(stats.currentBalance)}
          trend={stats.profitPct}
        />
        <StatCard
          label="Total Profit"
          value={formatCurrency(stats.profit)}
          trend={stats.profitPct}
          isProfit={stats.profit >= 0}
        />
        <StatCard
          label="Return"
          value={`${stats.profitPct >= 0 ? '+' : ''}${stats.profitPct.toFixed(2)}%`}
          trend={stats.profitPct}
          isProfit={stats.profitPct >= 0}
        />
        <StatCard
          label="Max Drawdown"
          value={`${stats.maxDrawdown.toFixed(2)}%`}
          isProfit={false}
          isDanger={stats.maxDrawdown > 20}
        />
      </div>

      {/* Chart */}
      <div className="relative w-full bg-card rounded-xl border border-border overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading equity curve...</p>
            </div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full" style={{ minHeight: `${height}px` }} />
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  label,
  value,
  trend,
  isProfit,
  isDanger,
}: {
  label: string
  value: string
  trend?: number
  isProfit?: boolean
  isDanger?: boolean
}) {
  const getTrendColor = () => {
    if (isDanger) return 'text-red-500'
    if (isProfit === undefined) return 'text-foreground'
    return isProfit ? 'text-green-500' : 'text-red-500'
  }

  const getTrendBg = () => {
    if (isDanger) return 'bg-red-500/10 border-red-500/20'
    if (isProfit === undefined) return 'bg-muted border-border'
    return isProfit ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
  }

  return (
    <div className={`rounded-xl border p-4 ${getTrendBg()}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold ${getTrendColor()}`}>{value}</p>
      {trend !== undefined && (
        <p className="text-xs text-muted-foreground mt-1">
          {trend >= 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(2)}%
        </p>
      )}
    </div>
  )
}
