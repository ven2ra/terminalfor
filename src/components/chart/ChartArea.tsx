import { useMemo, useState } from 'react'
import { GripVertical, X } from 'lucide-react'
import { useMarketStore } from '@/store/useMarketStore'
import { useLiveCandles } from '@/hooks/useLiveCandles'
import { TIMEFRAMES } from '@/lib/timeframes'
import { ResizableSplit } from '@/components/common/ResizableSplit'
import { PriceChart } from './PriceChart'
import { IndicatorsPanel } from './IndicatorsPanel'

interface ChartAreaProps {
  onRemove?: () => void
}

/** Объединяет основной график и панель RSI, разделённые изменяемой границей */
export function ChartArea({ onRemove }: ChartAreaProps) {
  const { selectedTicker, instruments } = useMarketStore()
  const instrument = instruments.find((i) => i.ticker === selectedTicker)
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[0])
  const { candles, loading, loadOlder, loadingMore, hasMore } = useLiveCandles(selectedTicker, timeframe.interval)

  // Реальные свечи с биржи подтягиваются раз в несколько секунд, а котировка в
  // шапке/стакане тикает чаще — чтобы график не "отставал" от неё визуально,
  // последняя свеча между опросами обновляется текущей живой ценой инструмента.
  const liveCandles = useMemo(() => {
    if (!instrument || candles.length === 0) return candles
    const last = candles[candles.length - 1]
    const price = instrument.lastPrice
    if (price === last.close) return candles
    const patched = { ...last, close: price, high: Math.max(last.high, price), low: Math.min(last.low, price) }
    return [...candles.slice(0, -1), patched]
  }, [candles, instrument?.lastPrice])

  return (
    <div className="flex h-full flex-col">
      {onRemove && (
        <div className="widget-drag-handle flex shrink-0 cursor-move select-none items-center justify-between border-b border-border-subtle bg-bg-panel px-3 py-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            <GripVertical size={12} /> График
          </div>
          <button
            onClick={onRemove}
            aria-label="Удалить виджет"
            className="rounded p-0.5 text-text-muted transition-colors hover:bg-sell-bg hover:text-sell"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <div className="min-h-0 flex-1">
        <ResizableSplit direction="vertical" initial={76} min={55} max={88}>
          <PriceChart
            candles={liveCandles}
            loading={loading}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            onLoadOlder={loadOlder}
            loadingMore={loadingMore}
            hasMore={hasMore}
          />
          <IndicatorsPanel candles={liveCandles} />
        </ResizableSplit>
      </div>
    </div>
  )
}
