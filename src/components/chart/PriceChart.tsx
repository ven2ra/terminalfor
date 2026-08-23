import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CandlestickData,
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  IChartApi,
  IPriceLine,
  ISeriesApi,
  LineData,
  LineSeries,
  createChart,
} from 'lightweight-charts'
import {
  ArrowsLeftRight,
  ArrowsIn,
  ArrowsOut,
  ChartBar,
  CornersOut,
  Minus as MinusIcon,
  Pulse,
  TrendUp,
  Waves,
  X,
} from '@phosphor-icons/react'
import { Candle } from '@/types'
import { CandleInterval, fetchCandles } from '@/api/client'
import { useMarketStore } from '@/store/useMarketStore'
import { useThemeStore } from '@/store/useThemeStore'
import { InstrumentLogo } from '@/components/common/InstrumentLogo'
import { SentimentBadge } from '@/components/chart/SentimentBadge'
import { usePriceFlash } from '@/hooks/usePriceFlash'
import { calcSMA, calcBollinger, calcVWAP } from '@/lib/indicators'
import { calcSupportResistance } from '@/lib/levels'
import { useAlertsStore } from '@/store/useAlertsStore'
import { ChartSkeleton } from '@/components/chart/ChartSkeleton'
import { crosshairTimeFormatter, tickMarkFormatter } from '@/lib/mskTime'
import { formatCompact, formatPercent, formatPrice } from '@/lib/format'
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
  const bollUpperRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bollMiddleRef = useRef<ISeriesApi<'Line'> | null>(null)
  const bollLowerRef = useRef<ISeriesApi<'Line'> | null>(null)
  const vwapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const srLinesRef = useRef<IPriceLine[]>([])
  const compareSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
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
  const { addAlert } = useAlertsStore()
  const [showMA, setShowMA] = useState(true)
  const [showVolume, setShowVolume] = useState(true)
  const [showBollinger, setShowBollinger] = useState(false)
  const [showVWAP, setShowVWAP] = useState(false)
  const [showLevels, setShowLevels] = useState(false)
  const [alertFlash, setAlertFlash] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [compareTicker, setCompareTicker] = useState<string | null>(null)
  const [compareCandles, setCompareCandles] = useState<Candle[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareQuery, setCompareQuery] = useState('')

  const instrument = instruments.find((i) => i.ticker === selectedTicker)
  const priceFlash = usePriceFlash(instrument?.lastPrice ?? 0)

  // Актуальный тикер/цена/создание алерта для обработчика двойного клика по
  // графику, который подписывается на chart один раз при монтировании
  const selectedTickerRef = useRef(selectedTicker)
  const lastPriceRef = useRef(instrument?.lastPrice ?? 0)
  const addAlertRef = useRef(addAlert)
  selectedTickerRef.current = selectedTicker
  lastPriceRef.current = instrument?.lastPrice ?? 0
  addAlertRef.current = addAlert

  // Создание графика один раз при монтировании
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: readCssVar('--text-secondary'),
        fontFamily: 'Sofia Sans Condensed, sans-serif',
        fontSize: 11,
        attributionLogo: false,
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

    const bollUpper = chart.addSeries(LineSeries, {
      color: 'rgba(96,165,250,0.55)',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const bollMiddle = chart.addSeries(LineSeries, {
      color: 'rgba(96,165,250,0.85)',
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const bollLower = chart.addSeries(LineSeries, {
      color: 'rgba(96,165,250,0.55)',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    const vwap = chart.addSeries(LineSeries, {
      color: readCssVar('--accent-cyan') || '#22d3ee',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })

    // Сравнение с другим инструментом — своя (скрытая) шкала цен в процентах
    // от начала видимого периода, чтобы форма движения была сопоставима
    // независимо от абсолютной цены сравниваемых бумаг
    const compare = chart.addSeries(LineSeries, {
      color: '#f97316',
      lineWidth: 2,
      priceScaleId: 'compare',
      priceFormat: { type: 'custom', formatter: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, minMove: 0.01 },
      priceLineVisible: false,
      lastValueVisible: false,
      visible: false,
    })
    chart.priceScale('compare').applyOptions({ visible: false })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries
    ma20SeriesRef.current = ma20
    ma50SeriesRef.current = ma50
    bollUpperRef.current = bollUpper
    bollMiddleRef.current = bollMiddle
    bollLowerRef.current = bollLower
    vwapSeriesRef.current = vwap
    compareSeriesRef.current = compare

    // Довыгрузка старой истории при прокрутке к левому краю загруженных данных
    const LOAD_MORE_THRESHOLD = 30 // баров до начала видимого диапазона
    const handleRangeChange = (range: { from: number; to: number } | null) => {
      if (!range || range.from > LOAD_MORE_THRESHOLD) return
      if (loadingMoreRef.current || hasMoreRef.current === false) return
      onLoadOlderRef.current?.()
    }
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange)

    // Двойной клик по графику — быстрое создание ценового алерта на цене клика
    const handleDblClick = (param: { point?: { x: number; y: number } }) => {
      if (!param.point || !candleSeriesRef.current) return
      const clickedPrice = candleSeriesRef.current.coordinateToPrice(param.point.y)
      if (clickedPrice == null) return
      const condition = clickedPrice >= lastPriceRef.current ? 'above' : 'below'
      addAlertRef.current(selectedTickerRef.current, condition, clickedPrice)
      setAlertFlash(`Алерт создан: ${selectedTickerRef.current} ${condition === 'above' ? '≥' : '≤'} ${formatPrice(clickedPrice)}`)
      setTimeout(() => setAlertFlash(null), 2500)
    }
    chart.subscribeDblClick(handleDblClick)

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleRangeChange)
      chart.unsubscribeDblClick(handleDblClick)
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

    const bollinger = calcBollinger(candles, 20, 2)
    bollUpperRef.current?.setData(bollinger.upper.map((p) => ({ time: p.time as never, value: p.value })))
    bollMiddleRef.current?.setData(bollinger.middle.map((p) => ({ time: p.time as never, value: p.value })))
    bollLowerRef.current?.setData(bollinger.lower.map((p) => ({ time: p.time as never, value: p.value })))

    const vwapData: LineData[] = calcVWAP(candles).map((p) => ({ time: p.time as never, value: p.value }))
    vwapSeriesRef.current?.setData(vwapData)

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

  useEffect(() => {
    bollUpperRef.current?.applyOptions({ visible: showBollinger })
    bollMiddleRef.current?.applyOptions({ visible: showBollinger })
    bollLowerRef.current?.applyOptions({ visible: showBollinger })
  }, [showBollinger])

  useEffect(() => {
    vwapSeriesRef.current?.applyOptions({ visible: showVWAP })
  }, [showVWAP])

  // Загрузка свечей инструмента для сравнения — тем же таймфреймом, что и основной график
  useEffect(() => {
    if (!compareTicker) {
      setCompareCandles([])
      return
    }
    let cancelled = false
    fetchCandles(compareTicker, timeframe.interval)
      .then((data) => {
        if (!cancelled) setCompareCandles(data)
      })
      .catch(() => {
        if (!cancelled) setCompareCandles([])
      })
    return () => {
      cancelled = true
    }
  }, [compareTicker, timeframe.interval])

  useEffect(() => {
    compareSeriesRef.current?.applyOptions({ visible: !!compareTicker })
    if (!compareTicker || compareCandles.length === 0) {
      compareSeriesRef.current?.setData([])
      return
    }
    const base = compareCandles[0].close
    const data: LineData[] = compareCandles.map((c) => ({
      time: c.time as never,
      value: base > 0 ? ((c.close - base) / base) * 100 : 0,
    }))
    compareSeriesRef.current?.setData(data)
  }, [compareTicker, compareCandles])

  // Уровни поддержки/сопротивления — рисуем как ценовые линии на свечном ряде,
  // пересчитываем при каждом обновлении свечей, пока включен показ
  useEffect(() => {
    const series = candleSeriesRef.current
    if (!series) return

    for (const line of srLinesRef.current) series.removePriceLine(line)
    srLinesRef.current = []

    if (!showLevels || candles.length === 0) return

    const levels = calcSupportResistance(candles, 4)
    for (const lvl of levels) {
      const color = lvl.type === 'resistance' ? readCssVar('--sell') : readCssVar('--buy')
      const line = series.createPriceLine({
        price: lvl.price,
        color: `${color}99`,
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: true,
        title: lvl.type === 'resistance' ? 'R' : 'S',
      })
      srLinesRef.current.push(line)
    }
  }, [candles, showLevels])

  // Выход из полноэкранного режима по Escape
  useEffect(() => {
    if (!isFullscreen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isFullscreen])

  const compareMatches = useMemo(() => {
    const q = compareQuery.trim().toLowerCase()
    if (!q) return []
    return instruments
      .filter((i) => i.ticker !== selectedTicker && (i.ticker.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)))
      .slice(0, 8)
  }, [instruments, compareQuery, selectedTicker])

  const positive = (instrument?.change ?? 0) >= 0
  // Официальные HIGH/LOW сессии с биржи — не считаем сами по загруженным
  // свечам: там из-за бесконечной подгрузки истории может быть много дней,
  // а не только сегодняшняя сессия
  const dayHigh = instrument?.dayHigh ?? null
  const dayLow = instrument?.dayLow ?? null

  const chartContent = (
    <div className={`flex h-full flex-col bg-bg-panel ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
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
              {instrument?.priceUnit === 'percent' ? '%' : ''}
            </span>
            {instrument && (
              <span className={`font-tabular text-sm font-semibold ${positive ? 'text-buy' : 'text-sell'}`}>
                {positive ? '+' : ''}
                {formatPrice(instrument.change)}
                {instrument.priceUnit === 'percent' ? '%' : ''} ({formatPercent(instrument.changePercent)})
              </span>
            )}
            {instrument && <SentimentBadge changePercent={instrument.changePercent} />}
          </div>
        </div>

        <div className="hidden gap-4 text-xs text-text-muted md:flex">
          <div>
            <div className="text-text-muted">Открытие</div>
            <div className="font-tabular text-text-secondary">
              {instrument?.dayOpen != null ? formatPrice(instrument.dayOpen, 3) : '—'}
            </div>
          </div>
          <div>
            <div className="text-text-muted">Макс</div>
            {/* 3 знака после запятой — у части бумаг шаг цены мельче 1 копейки, округление до 2 искажало значение */}
            <div className="font-tabular text-buy">{dayHigh != null ? formatPrice(dayHigh, 3) : '—'}</div>
          </div>
          <div>
            <div className="text-text-muted">Мин</div>
            <div className="font-tabular text-sell">{dayLow != null ? formatPrice(dayLow, 3) : '—'}</div>
          </div>
          <div>
            <div className="text-text-muted">Объём торгов</div>
            <div className="font-tabular text-text-secondary">
              {instrument ? `${formatCompact(instrument.turnover)} ₽` : '—'}
            </div>
          </div>
        </div>

        <div className="ml-auto flex max-w-full flex-nowrap items-center gap-1 overflow-x-auto [&>*]:shrink-0">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.label}
              onClick={() => onTimeframeChange(tf)}
              className={`rounded px-2 py-1 text-xs font-medium transition-all active:scale-95 ${
                timeframe.label === tf.label ? 'bg-accent text-accent-contrast' : 'text-text-secondary hover:bg-bg-hover'
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
            <TrendUp size={13} /> MA
          </button>
          <button
            onClick={() => setShowVolume((v) => !v)}
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
              showVolume ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:bg-bg-hover'
            }`}
          >
            <ChartBar size={13} /> Объём
          </button>
          <button
            onClick={() => setShowBollinger((v) => !v)}
            title="Полосы Боллинджера (20, 2σ)"
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
              showBollinger ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:bg-bg-hover'
            }`}
          >
            <Waves size={13} /> BB
          </button>
          <button
            onClick={() => setShowVWAP((v) => !v)}
            title="VWAP — средневзвешенная по объёму цена"
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
              showVWAP ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:bg-bg-hover'
            }`}
          >
            <Pulse size={13} /> VWAP
          </button>
          <button
            onClick={() => setShowLevels((v) => !v)}
            title="Автоматические уровни поддержки/сопротивления"
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
              showLevels ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:bg-bg-hover'
            }`}
          >
            <MinusIcon size={13} /> S/R
          </button>
          <div className="relative">
            {compareTicker ? (
              <button
                onClick={() => setCompareTicker(null)}
                title="Убрать сравнение"
                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-[#f97316] transition-colors hover:bg-bg-hover"
              >
                <ArrowsLeftRight size={13} /> {compareTicker} <X size={11} />
              </button>
            ) : (
              <button
                onClick={() => setCompareOpen((v) => !v)}
                title="Сравнить с другим инструментом"
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  compareOpen ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:bg-bg-hover'
                }`}
              >
                <ArrowsLeftRight size={13} /> Сравнить
              </button>
            )}
            {compareOpen && !compareTicker && (
              <div className="absolute right-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-md border border-border-color bg-bg-elevated shadow-panel">
                <input
                  autoFocus
                  value={compareQuery}
                  onChange={(e) => setCompareQuery(e.target.value)}
                  placeholder="Тикер или название…"
                  className="w-full border-b border-border-color bg-transparent px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
                />
                <div className="max-h-56 overflow-y-auto">
                  {compareMatches.map((i) => (
                    <button
                      key={i.ticker}
                      onClick={() => {
                        setCompareTicker(i.ticker)
                        setCompareOpen(false)
                        setCompareQuery('')
                      }}
                      className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs hover:bg-bg-hover"
                    >
                      <span className="font-semibold text-text-primary">{i.ticker}</span>
                      <span className="truncate text-text-muted">{i.name}</span>
                    </button>
                  ))}
                  {compareQuery && compareMatches.length === 0 && (
                    <div className="px-2.5 py-2 text-xs text-text-muted">Ничего не найдено</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() =>
              chartRef.current?.timeScale().setVisibleLogicalRange({ from: -0.5, to: candles.length - 0.5 })
            }
            title="Сбросить масштаб"
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover"
          >
            <CornersOut size={13} />
          </button>
          <button
            onClick={() => setIsFullscreen((v) => !v)}
            title={isFullscreen ? 'Свернуть (Esc)' : 'На весь экран'}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover"
          >
            {isFullscreen ? <ArrowsIn size={13} /> : <ArrowsOut size={13} />}
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {loading && candles.length === 0 && <ChartSkeleton />}
        {loadingMore && (
          <div className="absolute left-2 top-2 z-10 rounded bg-bg-elevated/90 px-2 py-1 text-[11px] text-text-muted">
            Загрузка истории…
          </div>
        )}
        {alertFlash && (
          <div className="animate-pop-in absolute right-2 top-2 z-10 rounded-md bg-accent/15 px-2.5 py-1.5 text-[11px] font-medium text-accent">
            {alertFlash}
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" title="Двойной клик по графику — создать ценовой алерт" />
      </div>
    </div>
  )

  return isFullscreen ? createPortal(chartContent, document.body) : chartContent
}
