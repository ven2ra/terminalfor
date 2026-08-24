import { useEffect, useRef } from 'react'
import { CandlestickSeries, ColorType, IChartApi, ISeriesApi, createChart } from 'lightweight-charts'
import { useLiveCandles } from '@/hooks/useLiveCandles'
import { readCssVar } from '@/lib/cssVar'
import { tickMarkFormatter, crosshairTimeFormatter } from '@/lib/mskTime'

/** Минималистичный график минутных свечей без тулбара и индикаторов — только форма движения цены, для скальперской колонки */
export function ScalperMiniChart({ ticker }: { ticker: string }) {
  const { candles } = useLiveCandles(ticker, 1)
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: readCssVar('--text-muted'),
        fontFamily: 'Inter, sans-serif',
        fontSize: 10,
        attributionLogo: false,
      },
      grid: { vertLines: { visible: false }, horzLines: { color: readCssVar('--border-subtle') } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: readCssVar('--border-subtle') },
      timeScale: {
        borderColor: readCssVar('--border-subtle'),
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter,
      },
      localization: { timeFormatter: crosshairTimeFormatter },
      handleScroll: false,
      handleScale: false,
      autoSize: true,
    })
    const series = chart.addSeries(CandlestickSeries, {
      upColor: readCssVar('--buy'),
      downColor: readCssVar('--sell'),
      borderVisible: false,
      wickUpColor: readCssVar('--buy'),
      wickDownColor: readCssVar('--sell'),
    })
    chartRef.current = chart
    seriesRef.current = series
    return () => {
      chart.remove()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return
    seriesRef.current.setData(candles.map((c) => ({ time: c.time as never, open: c.open, high: c.high, low: c.low, close: c.close })))
    chartRef.current?.timeScale().scrollToRealTime()
  }, [candles])

  return <div ref={containerRef} className="h-full w-full" />
}
