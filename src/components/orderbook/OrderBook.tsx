import { useMarketStore } from '@/store/useMarketStore'
import { useOrderDraftStore } from '@/store/useOrderDraftStore'
import { Panel } from '@/components/common/Panel'
import { OrderBookDepthChart } from './OrderBookDepthChart'
import { usePriceFlash } from '@/hooks/usePriceFlash'
import { formatPrice } from '@/lib/format'

interface OrderBookProps {
  onRemove?: () => void
}

/** Стакан заявок с визуализацией глубины рынка. Клик по строке подставляет цену в панель ордера */
export function OrderBook({ onRemove }: OrderBookProps) {
  const { orderBook, instruments, selectedTicker } = useMarketStore()
  const { setDraftFromBook } = useOrderDraftStore()
  const instrument = instruments.find((i) => i.ticker === selectedTicker)
  const priceFlash = usePriceFlash(instrument?.lastPrice ?? 0)

  const maxTotal = Math.max(
    orderBook.bids[orderBook.bids.length - 1]?.total ?? 1,
    orderBook.asks[orderBook.asks.length - 1]?.total ?? 1
  )

  return (
    <Panel title="Стакан заявок" noPadding draggable={!!onRemove} onRemove={onRemove}>
      <div className="flex h-full flex-col text-xs">
        <div className="shrink-0 border-b border-border-subtle px-2 pt-2">
          <OrderBookDepthChart bids={orderBook.bids} asks={orderBook.asks} />
        </div>
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
              <button
                key={`ask-${idx}`}
                onClick={() => setDraftFromBook(level.price, 'ask')}
                title="Купить по этой цене"
                className="relative grid w-full grid-cols-3 gap-1 px-3 py-[3px] text-left font-tabular transition-colors hover:bg-bg-hover"
              >
                <div
                  className="absolute inset-y-0 right-0 bg-sell-bg"
                  style={{ width: `${(level.total / maxTotal) * 100}%` }}
                />
                <span className="relative text-sell">{formatPrice(level.price)}</span>
                <span className="relative text-right text-text-secondary">{level.size}</span>
                <span className="relative text-right text-text-muted">{level.total}</span>
              </button>
            ))}
        </div>

        <div className="shrink-0 border-y border-border-subtle bg-bg-elevated px-3 py-2 text-center">
          <span
            className={`rounded font-tabular text-base font-bold text-text-primary ${
              priceFlash === 'up' ? 'animate-flash-up' : priceFlash === 'down' ? 'animate-flash-down' : ''
            }`}
          >
            {instrument ? formatPrice(instrument.lastPrice) : '—'}
          </span>
        </div>

        <div className="flex-1 overflow-hidden">
          {orderBook.bids.map((level, idx) => (
            <button
              key={`bid-${idx}`}
              onClick={() => setDraftFromBook(level.price, 'bid')}
              title="Продать по этой цене"
              className="relative grid w-full grid-cols-3 gap-1 px-3 py-[3px] text-left font-tabular transition-colors hover:bg-bg-hover"
            >
              <div
                className="absolute inset-y-0 right-0 bg-buy-bg"
                style={{ width: `${(level.total / maxTotal) * 100}%` }}
              />
              <span className="relative text-buy">{formatPrice(level.price)}</span>
              <span className="relative text-right text-text-secondary">{level.size}</span>
              <span className="relative text-right text-text-muted">{level.total}</span>
            </button>
          ))}
        </div>
      </div>
    </Panel>
  )
}
