import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts'

interface CandleData {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface CandleChartProps {
  data: CandleData[]
  height?: number
  showVolume?: boolean
  autoSize?: boolean
  onCrosshairMove?: (price: number | null, time: string | null) => void
}

export default function CandleChart({
  data,
  height = 500,
  showVolume = true,
  autoSize = true,
  onCrosshairMove,
}: CandleChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return

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
          bottom: showVolume ? 0.3 : 0.1,
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

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    })

    candleSeriesRef.current = candleSeries

    // Add volume series if enabled
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#6B7280',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      })
      volumeSeriesRef.current = volumeSeries
    }

    // Convert data to Lightweight Charts format
    const candleData: CandlestickData[] = data.map((candle) => ({
      time: (new Date(candle.timestamp).getTime() / 1000) as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }))

    const volumeData = data.map((candle) => ({
      time: (new Date(candle.timestamp).getTime() / 1000) as Time,
      value: candle.volume,
      color: candle.close >= candle.open ? '#10B98133' : '#EF444433',
    }))

    // Set data
    candleSeries.setData(candleData)
    if (showVolume && volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(volumeData)
    }

    // Fit content
    chart.timeScale().fitContent()

    setIsLoading(false)

    // Crosshair move handler
    if (onCrosshairMove) {
      chart.subscribeCrosshairMove((param) => {
        if (param.time) {
          const data = param.seriesData.get(candleSeries) as CandlestickData | undefined
          if (data) {
            onCrosshairMove(data.close, new Date(Number(param.time) * 1000).toISOString())
          }
        } else {
          onCrosshairMove(null, null)
        }
      })
    }

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
  }, [data, height, showVolume, autoSize, onCrosshairMove])

  return (
    <div className="relative w-full bg-card rounded-xl border border-border overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading chart...</p>
          </div>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full" />
    </div>
  )
}
