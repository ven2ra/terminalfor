import { useEffect, useRef } from 'react'
import { AreaSeries, ColorType, IChartApi, ISeriesApi, LineData, createChart } from 'lightweight-charts'
import { Candle } from '@/types'
import { calcRSI } from '@/lib/indicators'
import { useThemeStore } from '@/store/useThemeStore'
import { crosshairTimeFormatter, tickMarkFormatter } from '@/lib/mskTime'

function readCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

interface IndicatorsPanelProps {
  candles: Candle[]
}

/** Панель технических индикаторов: RSI(14) с зонами перекупленности/перепроданности */
export function IndicatorsPanel({ candles }: IndicatorsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const rsiSeriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const { theme } = useThemeStore()

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: readCssVar('--text-secondary'), fontSize: 11 },
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

    chartRef.current = chart
    rsiSeriesRef.current = rsiSeries
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
  }, [candles])

  return (
    <div className="flex h-full flex-col bg-bg-panel">
      <div className="shrink-0 border-b border-border-subtle px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        RSI (14)
      </div>
      <div ref={containerRef} className="min-h-0 flex-1" />
    </div>
  )
}
