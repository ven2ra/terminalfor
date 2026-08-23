import { useState } from 'react'
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
  const { selectedTicker } = useMarketStore()
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[0])
  const { candles, loading } = useLiveCandles(selectedTicker, timeframe.interval)

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
          <PriceChart candles={candles} loading={loading} timeframe={timeframe} onTimeframeChange={setTimeframe} />
          <IndicatorsPanel candles={candles} />
        </ResizableSplit>
      </div>
    </div>
  )
}
