import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CandlestickData,
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  LineData,
  LineSeries,
  createChart,
} from 'lightweight-charts'
import { BarChart3, TrendingUp } from 'lucide-react'
import { Candle } from '@/types'
import { CandleInterval } from '@/api/client'
import { useMarketStore } from '@/store/useMarketStore'
import { useThemeStore } from '@/store/useThemeStore'
import { InstrumentLogo } from '@/components/common/InstrumentLogo'
import { calcSMA } from '@/lib/indicators'
import { formatPercent, formatPrice } from '@/lib/format'
import { TIMEFRAMES } from '@/lib/timeframes'

function readCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

interface PriceChartProps {
  candles: Candle[]
  loading: boolean
  timeframe: { label: string; interval: CandleInterval }
  onTimeframeChange: (tf: { label: string; interval: CandleInterval }) => void
}

/** Главный свечной график с MA-индикаторами и гистограммой объёмов — реальные данные МосБиржи */
export function PriceChart({ candles, loading, timeframe, onTimeframeChange }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const ma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  const { instruments, selectedTicker } = useMarketStore()
  const { theme } = useThemeStore()
  const [showMA, setShowMA] = useState(true)
  const [showVolume, setShowVolume] = useState(true)

  const instrument = instruments.find((i) => i.ticker === selectedTicker)

  // Создание графика один раз при монтировании
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: readCssVar('--text-secondary'),
        fontFamily: 'Inter, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: readCssVar('--border-subtle') },
        horzLines: { color: readCssVar('--border-subtle') },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: readCssVar('--border-color') },
      timeScale: { borderColor: readCssVar('--border-color'), timeVisible: true, secondsVisible: false },
      autoSize: true,
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: readCssVar('--buy'),
      downColor: readCssVar('--sell'),
      borderVisible: false,
      wickUpColor: readCssVar('--buy'),
      wickDownColor: readCssVar('--sell'),
    })

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })

    const ma20 = chart.addSeries(LineSeries, { color: '#f5a623', lineWidth: 1, priceLineVisible: false })
    const ma50 = chart.addSeries(LineSeries, { color: '#a367f5', lineWidth: 1, priceLineVisible: false })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries
    ma20SeriesRef.current = ma20
    ma50SeriesRef.current = ma50

    return () => {
      chart.remove()
      chartRef.current = null
    }
  }, [])

  // Перекраска графика при смене темы
  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.applyOptions({
      layout: { textColor: readCssVar('--text-secondary') },
      grid: {
        vertLines: { color: readCssVar('--border-subtle') },
        horzLines: { color: readCssVar('--border-subtle') },
      },
      rightPriceScale: { borderColor: readCssVar('--border-color') },
      timeScale: { borderColor: readCssVar('--border-color') },
    })
    candleSeriesRef.current?.applyOptions({
      upColor: readCssVar('--buy'),
      downColor: readCssVar('--sell'),
      wickUpColor: readCssVar('--buy'),
      wickDownColor: readCssVar('--sell'),
    })
  }, [theme])

  // Обновление данных при поступлении новых свечей
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) return

    const candleData: CandlestickData[] = candles.map((c) => ({
      time: c.time as never,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))
    candleSeriesRef.current.setData(candleData)

    const buyColor = `${readCssVar('--buy')}66`
    const sellColor = `${readCssVar('--sell')}66`
    volumeSeriesRef.current.setData(
      candles.map((c) => ({ time: c.time as never, value: c.volume, color: c.close >= c.open ? buyColor : sellColor }))
    )

    const ma20Data: LineData[] = calcSMA(candles, 20).map((p) => ({ time: p.time as never, value: p.value }))
    const ma50Data: LineData[] = calcSMA(candles, 50).map((p) => ({ time: p.time as never, value: p.value }))
    ma20SeriesRef.current?.setData(ma20Data)
    ma50SeriesRef.current?.setData(ma50Data)

    chartRef.current?.timeScale().fitContent()
  }, [candles])

  useEffect(() => {
    ma20SeriesRef.current?.applyOptions({ visible: showMA })
    ma50SeriesRef.current?.applyOptions({ visible: showMA })
  }, [showMA])

  useEffect(() => {
    volumeSeriesRef.current?.applyOptions({ visible: showVolume })
  }, [showVolume])

  const positive = (instrument?.change ?? 0) >= 0
  const dayHigh = useMemo(() => (candles.length ? Math.max(...candles.map((c) => c.high)) : null), [candles])
  const dayLow = useMemo(() => (candles.length ? Math.min(...candles.map((c) => c.low)) : null), [candles])

  return (
    <div className="flex h-full flex-col bg-bg-panel">
      <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 border-b border-border-subtle px-4 py-2.5">
        <div>
          <div className="flex items-center gap-2">
            <InstrumentLogo ticker={selectedTicker} isin={instrument?.isin ?? null} size={22} />
            <span className="text-lg font-bold text-text-primary">{instrument?.ticker ?? selectedTicker}</span>
            <span className="text-xs text-text-muted">
              {instrument?.name ?? '…'} · {instrument?.exchange ?? 'MOEX'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-tabular text-2xl font-bold text-text-primary">
              {instrument ? formatPrice(instrument.lastPrice) : '—'}
            </span>
            {instrument && (
              <span className={`font-tabular text-sm font-semibold ${positive ? 'text-buy' : 'text-sell'}`}>
                {positive ? '+' : ''}
                {formatPrice(instrument.change)} ({formatPercent(instrument.changePercent)})
              </span>
            )}
          </div>
        </div>

        <div className="hidden gap-4 text-xs text-text-muted md:flex">
          <div>
            <div className="text-text-muted">Макс</div>
            <div className="font-tabular text-text-secondary">{dayHigh != null ? formatPrice(dayHigh) : '—'}</div>
          </div>
          <div>
            <div className="text-text-muted">Мин</div>
            <div className="font-tabular text-text-secondary">{dayLow != null ? formatPrice(dayLow) : '—'}</div>
          </div>
          <div>
            <div className="text-text-muted">Объём</div>
            <div className="font-tabular text-text-secondary">{(instrument?.volume ?? 0).toLocaleString('ru-RU')}</div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.label}
              onClick={() => onTimeframeChange(tf)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                timeframe.label === tf.label ? 'bg-accent text-white' : 'text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {tf.label}
            </button>
          ))}
          <div className="mx-1 h-4 w-px bg-border-color" />
          <button
            onClick={() => setShowMA((v) => !v)}
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
              showMA ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:bg-bg-hover'
            }`}
          >
            <TrendingUp size={13} /> MA
          </button>
          <button
            onClick={() => setShowVolume((v) => !v)}
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
              showVolume ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:bg-bg-hover'
            }`}
          >
            <BarChart3 size={13} /> Объём
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {loading && candles.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-panel/70 text-sm text-text-muted">
            Загрузка котировок с МосБиржи…
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  )
}
