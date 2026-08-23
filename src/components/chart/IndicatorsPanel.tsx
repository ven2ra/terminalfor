import { useEffect, useRef, useState } from 'react'
import {
  AreaSeries,
  ColorType,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  LineData,
  LineSeries,
  createChart,
} from 'lightweight-charts'
import { Candle } from '@/types'
import { calcRSI, calcMACD } from '@/lib/indicators'
import { useThemeStore } from '@/store/useThemeStore'
import { crosshairTimeFormatter, tickMarkFormatter } from '@/lib/mskTime'

function readCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

interface IndicatorsPanelProps {
  candles: Candle[]
}

type IndicatorMode = 'rsi' | 'macd'

/** Панель технических индикаторов: переключаемые RSI(14) и MACD(12,26,9) */
export function IndicatorsPanel({ candles }: IndicatorsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const rsiSeriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const macdHistRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const macdLineRef = useRef<ISeriesApi<'Line'> | null>(null)
  const macdSignalRef = useRef<ISeriesApi<'Line'> | null>(null)
  const { theme } = useThemeStore()
  const [mode, setMode] = useState<IndicatorMode>('rsi')

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: readCssVar('--text-secondary'),
        fontSize: 11,
        attributionLogo: false,
      },
      grid: { vertLines: { color: readCssVar('--border-subtle') }, horzLines: { color: readCssVar('--border-subtle') } },
      rightPriceScale: { borderColor: readCssVar('--border-color') },
      timeScale: { borderColor: readCssVar('--border-color'), timeVisible: true, secondsVisible: false, tickMarkFormatter },
      localization: { timeFormatter: crosshairTimeFormatter },
      autoSize: true,
    })

    const rsiSeries = chart.addSeries(AreaSeries, {
      lineColor: readCssVar('--accent'),
      topColor: `${readCssVar('--accent')}33`,
      bottomColor: 'transparent',
      lineWidth: 2,
      priceLineVisible: false,
    })
    rsiSeries.createPriceLine({ price: 70, color: readCssVar('--sell'), lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '70' })
    rsiSeries.createPriceLine({ price: 30, color: readCssVar('--buy'), lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '30' })

    const macdHist = chart.addSeries(HistogramSeries, { priceLineVisible: false, visible: false })
    const macdLine = chart.addSeries(LineSeries, { color: readCssVar('--accent'), lineWidth: 1, priceLineVisible: false, visible: false })
    const macdSignal = chart.addSeries(LineSeries, { color: readCssVar('--sell'), lineWidth: 1, priceLineVisible: false, visible: false })

    chartRef.current = chart
    rsiSeriesRef.current = rsiSeries
    macdHistRef.current = macdHist
    macdLineRef.current = macdLine
    macdSignalRef.current = macdSignal
    return () => {
      chart.remove()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.applyOptions({
      layout: { textColor: readCssVar('--text-secondary') },
      grid: { vertLines: { color: readCssVar('--border-subtle') }, horzLines: { color: readCssVar('--border-subtle') } },
      rightPriceScale: { borderColor: readCssVar('--border-color') },
      timeScale: { borderColor: readCssVar('--border-color') },
    })
  }, [theme])

  useEffect(() => {
    if (!rsiSeriesRef.current) return
    const data: LineData[] = calcRSI(candles, 14).map((p) => ({ time: p.time as never, value: p.value }))
    rsiSeriesRef.current.setData(data)

    const { macd, signal, histogram } = calcMACD(candles, 12, 26, 9)
    const buyColor = `${readCssVar('--buy')}99`
    const sellColor = `${readCssVar('--sell')}99`
    macdHistRef.current?.setData(
      histogram.map((p) => ({ time: p.time as never, value: p.value, color: p.value >= 0 ? buyColor : sellColor }))
    )
    macdLineRef.current?.setData(macd.map((p) => ({ time: p.time as never, value: p.value })))
    macdSignalRef.current?.setData(signal.map((p) => ({ time: p.time as never, value: p.value })))
  }, [candles])

  useEffect(() => {
    rsiSeriesRef.current?.applyOptions({ visible: mode === 'rsi' })
    macdHistRef.current?.applyOptions({ visible: mode === 'macd' })
    macdLineRef.current?.applyOptions({ visible: mode === 'macd' })
    macdSignalRef.current?.applyOptions({ visible: mode === 'macd' })
  }, [mode])

  return (
    <div className="flex h-full flex-col bg-bg-panel">
      <div className="flex shrink-0 items-center gap-1 border-b border-border-subtle px-2 py-1">
        {(['rsi', 'macd'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
              mode === m ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:bg-bg-hover'
            }`}
          >
            {m === 'rsi' ? 'RSI (14)' : 'MACD (12,26,9)'}
          </button>
        ))}
      </div>
      <div ref={containerRef} className="min-h-0 flex-1" />
    </div>
  )
}
