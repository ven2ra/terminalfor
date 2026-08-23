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
import { BarChart3, Maximize2, TrendingUp } from 'lucide-react'
import { Candle } from '@/types'
import { CandleInterval } from '@/api/client'
import { useMarketStore } from '@/store/useMarketStore'
import { useThemeStore } from '@/store/useThemeStore'
import { InstrumentLogo } from '@/components/common/InstrumentLogo'
import { usePriceFlash } from '@/hooks/usePriceFlash'
import { calcSMA } from '@/lib/indicators'
import { crosshairTimeFormatter, tickMarkFormatter } from '@/lib/mskTime'
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
  onLoadOlder?: () => void
  loadingMore?: boolean
  hasMore?: boolean
}

/** Главный свечной график с MA-индикаторами и гистограммой объёмов — реальные данные МосБиржи */
export function PriceChart({
  candles,
  loading,
  timeframe,
  onTimeframeChange,
  onLoadOlder,
  loadingMore,
  hasMore,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const ma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  // Ключ (тикер+таймфрейм), на который масштаб уже подгонялся — чтобы не
  // сбрасывать зум/скролл пользователя при каждом периодическом обновлении данных
  const fittedKeyRef = useRef<string>('')
  // Предыдущий массив свечей — чтобы отличить довыгрузку старой истории
  // (бары добавились СПЕРЕДИ) от обычного периодического опроса
  const prevCandlesRef = useRef<Candle[]>([])
  // Актуальные колбэки/флаги подгрузки истории для обработчика скролла,
  // который подписывается на chart один раз при монтировании
  const onLoadOlderRef = useRef(onLoadOlder)
  const loadingMoreRef = useRef(loadingMore)
  const hasMoreRef = useRef(hasMore)
  onLoadOlderRef.current = onLoadOlder
  loadingMoreRef.current = loadingMore
  hasMoreRef.current = hasMore

  const { instruments, selectedTicker } = useMarketStore()
  const { theme } = useThemeStore()
  const [showMA, setShowMA] = useState(true)
  const [showVolume, setShowVolume] = useState(true)

  const instrument = instruments.find((i) => i.ticker === selectedTicker)
  const priceFlash = usePriceFlash(instrument?.lastPrice ?? 0)

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
      timeScale: {
        borderColor: readCssVar('--border-color'),
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter,
        minBarSpacing: 0.001,
      },
      localization: { timeFormatter: crosshairTimeFormatter },
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

    const ma20 = chart.addSeries(LineSeries, { color: '#fbbf24', lineWidth: 1, priceLineVisible: false })
    const ma50 = chart.addSeries(LineSeries, { color: '#a367f5', lineWidth: 1, priceLineVisible: false })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries
    ma20SeriesRef.current = ma20
    ma50SeriesRef.current = ma50

    // Довыгрузка старой истории при прокрутке к левому краю загруженных данных
    const LOAD_MORE_THRESHOLD = 30 // баров до начала видимого диапазона
    const handleRangeChange = (range: { from: number; to: number } | null) => {
      if (!range || range.from > LOAD_MORE_THRESHOLD) return
      if (loadingMoreRef.current || hasMoreRef.current === false) return
      onLoadOlderRef.current?.()
    }
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange)

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleRangeChange)
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

    // setData() полностью пересоздаёт ряд, поэтому нужно самим запомнить,
    // смотрел ли пользователь на правый край (актуальное время) ДО обновления —
    // иначе новые бары просто формируются за пределами видимой области незаметно
    const timeScale = chartRef.current?.timeScale()
    const wasAtRealTime = (timeScale?.scrollPosition() ?? 0) >= -2
    const visibleRangeBefore = timeScale?.getVisibleLogicalRange() ?? null

    const prevCandles = prevCandlesRef.current
    prevCandlesRef.current = candles
    // Довыгрузка старой истории добавляет бары СПЕРЕДИ массива — хвост (последний
    // бар) при этом не меняется, в отличие от обычного периодического опроса
    const prependedCount =
      prevCandles.length > 0 &&
      candles.length > prevCandles.length &&
      candles[candles.length - 1]?.time === prevCandles[prevCandles.length - 1]?.time &&
      candles[0].time < prevCandles[0].time
        ? candles.length - prevCandles.length
        : 0

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

    // Автоподгонка масштаба — только при смене инструмента/таймфрейма, а не на
    // каждый периодический опрос (иначе зум/прокрутку пользователя сбрасывало бы каждые пару секунд).
    // Если же пользователь и так смотрел на актуальное время — доскролливаем к новым барам,
    // чтобы график продолжал жить, а не замирал за пределами видимой области.
    const fitKey = `${selectedTicker}:${timeframe.interval}`
    if (fittedKeyRef.current !== fitKey) {
      fittedKeyRef.current = fitKey
      // fitContent() при очень большом числе баров (тысячи дневных/недельных
      // свечей) не всегда растягивает вид на всю историю — явно задаём
      // логический диапазон от первого до последнего бара.
      timeScale?.setVisibleLogicalRange({ from: -0.5, to: candles.length - 0.5 })
    } else if (prependedCount > 0 && visibleRangeBefore) {
      // Индексы всех баров сдвинулись на число довыгруженных — держим на экране те же свечи
      timeScale?.setVisibleLogicalRange({
        from: visibleRangeBefore.from + prependedCount,
        to: visibleRangeBefore.to + prependedCount,
      })
    } else if (wasAtRealTime) {
      timeScale?.scrollToRealTime()
    }
  }, [candles, selectedTicker, timeframe.interval])

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
            <span
              className={`rounded font-tabular text-2xl font-bold text-text-primary ${
                priceFlash === 'up' ? 'animate-flash-up' : priceFlash === 'down' ? 'animate-flash-down' : ''
              }`}
            >
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
          <button
            onClick={() =>
              chartRef.current?.timeScale().setVisibleLogicalRange({ from: -0.5, to: candles.length - 0.5 })
            }
            title="Сбросить масштаб"
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {loading && candles.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-panel/70 text-sm text-text-muted">
            Загрузка котировок с МосБиржи…
          </div>
        )}
        {loadingMore && (
          <div className="absolute left-2 top-2 z-10 rounded bg-bg-elevated/90 px-2 py-1 text-[11px] text-text-muted">
            Загрузка истории…
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  )
}
