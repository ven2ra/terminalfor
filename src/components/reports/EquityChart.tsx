import { useEffect, useRef } from 'react'
import { AreaSeries, ColorType, IChartApi, ISeriesApi, LineData, createChart } from 'lightweight-charts'
import { useThemeStore } from '@/store/useThemeStore'
import { crosshairTimeFormatter, tickMarkFormatter } from '@/lib/mskTime'
import { EquityPoint } from '@/store/useEquityHistoryStore'

function readCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

interface EquityChartProps {
  points: EquityPoint[]
}

/** График динамики капитала портфеля (equity curve) за выбранный период */
export function EquityChart({ points }: EquityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const { theme } = useThemeStore()

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: readCssVar('--text-secondary'),
        fontFamily: 'Onest, sans-serif',
        fontSize: 11,
        attributionLogo: false,
      },
      grid: { vertLines: { color: readCssVar('--border-subtle') }, horzLines: { color: readCssVar('--border-subtle') } },
      rightPriceScale: { borderColor: readCssVar('--border-color') },
      timeScale: { borderColor: readCssVar('--border-color'), timeVisible: true, secondsVisible: false, tickMarkFormatter },
      localization: { timeFormatter: crosshairTimeFormatter },
      autoSize: true,
    })

    const series = chart.addSeries(AreaSeries, {
      lineColor: readCssVar('--accent'),
      topColor: `${readCssVar('--accent')}33`,
      bottomColor: 'transparent',
      lineWidth: 2,
      priceLineVisible: false,
      priceFormat: { type: 'price', precision: 0, minMove: 1 },
    })

    chartRef.current = chart
    seriesRef.current = series
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
    if (!seriesRef.current) return
    // Дедуп на случай двух точек в одну секунду (persist-восстановление и т.п.) —
    // lightweight-charts требует строго возрастающие уникальные метки времени
    const seen = new Set<number>()
    const data: LineData[] = []
    for (const p of points) {
      const time = Math.floor(p.time / 1000)
      if (seen.has(time)) continue
      seen.add(time)
      data.push({ time: time as never, value: p.equity })
    }
    seriesRef.current.setData(data)
    chartRef.current?.timeScale().fitContent()
  }, [points])

  if (points.length < 2) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-text-muted">
        Недостаточно данных за период — график наполнится по ходу сессии
      </div>
    )
  }

  return <div ref={containerRef} className="h-full w-full" />
}
