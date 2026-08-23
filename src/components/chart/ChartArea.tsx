import { useMarketStore } from '@/store/useMarketStore'
import { useLiveCandles } from '@/hooks/useLiveCandles'
import { ResizableSplit } from '@/components/common/ResizableSplit'
import { PriceChart } from './PriceChart'
import { IndicatorsPanel } from './IndicatorsPanel'

/** Объединяет основной график и панель RSI, разделённые изменяемой границей */
export function ChartArea() {
  const { instruments, selectedTicker } = useMarketStore()
  const instrument = instruments.find((i) => i.ticker === selectedTicker) ?? instruments[0]
  const candles = useLiveCandles(selectedTicker, instrument.lastPrice)

  return (
    <ResizableSplit direction="vertical" initial={76} min={55} max={88}>
      <PriceChart candles={candles} />
      <IndicatorsPanel candles={candles} />
    </ResizableSplit>
  )
}
