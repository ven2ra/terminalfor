import { useMarketStore } from '@/store/useMarketStore'
import { Panel } from '@/components/common/Panel'
import { formatPrice } from '@/lib/format'

/** Стакан заявок с визуализацией глубины рынка (заливка по объёму) */
export function OrderBook() {
  const { orderBook, instruments, selectedTicker } = useMarketStore()
  const instrument = instruments.find((i) => i.ticker === selectedTicker) ?? instruments[0]

  const maxTotal = Math.max(
    orderBook.bids[orderBook.bids.length - 1]?.total ?? 1,
    orderBook.asks[orderBook.asks.length - 1]?.total ?? 1
  )

  return (
    <Panel title="Стакан заявок" noPadding>
      <div className="flex h-full flex-col text-xs">
        <div className="grid shrink-0 grid-cols-3 gap-1 px-3 py-1.5 text-text-muted">
          <span>Цена</span>
          <span className="text-right">Объём</span>
          <span className="text-right">Итого</span>
        </div>

        <div className="flex flex-1 flex-col-reverse overflow-hidden">
          {orderBook.asks
            .slice()
            .reverse()
            .map((level, idx) => (
              <div key={`ask-${idx}`} className="relative grid grid-cols-3 gap-1 px-3 py-[3px] font-tabular">
                <div
                  className="absolute inset-y-0 right-0 bg-sell-bg"
                  style={{ width: `${(level.total / maxTotal) * 100}%` }}
                />
                <span className="relative text-sell">{formatPrice(level.price)}</span>
                <span className="relative text-right text-text-secondary">{level.size}</span>
                <span className="relative text-right text-text-muted">{level.total}</span>
              </div>
            ))}
        </div>

        <div className="shrink-0 border-y border-border-subtle bg-bg-elevated px-3 py-2 text-center">
          <span className="font-tabular text-base font-bold text-text-primary">{formatPrice(instrument.lastPrice)}</span>
        </div>

        <div className="flex-1 overflow-hidden">
          {orderBook.bids.map((level, idx) => (
            <div key={`bid-${idx}`} className="relative grid grid-cols-3 gap-1 px-3 py-[3px] font-tabular">
              <div
                className="absolute inset-y-0 right-0 bg-buy-bg"
                style={{ width: `${(level.total / maxTotal) * 100}%` }}
              />
              <span className="relative text-buy">{formatPrice(level.price)}</span>
              <span className="relative text-right text-text-secondary">{level.size}</span>
              <span className="relative text-right text-text-muted">{level.total}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}
