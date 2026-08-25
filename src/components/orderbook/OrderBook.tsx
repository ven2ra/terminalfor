import { useMarketStore } from '@/store/useMarketStore'
import { useOrderDraftStore } from '@/store/useOrderDraftStore'
import { Panel } from '@/components/common/Panel'
import { OrderBookDepthChart } from './OrderBookDepthChart'
import { usePriceFlash } from '@/hooks/usePriceFlash'
import { useMarketOpen, useMarketOpenCountdown } from '@/hooks/useMarketOpen'
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
  // Вне торговой сессии (будни 09:50–23:50 МСК, выходные — сессия выходного
  // дня 09:50–18:59) стакан заморожен на последнем известном состоянии — показываем это явно
  const bookOpen = useMarketOpen()
  const countdown = useMarketOpenCountdown()

  const maxTotal = Math.max(
    orderBook.bids[orderBook.bids.length - 1]?.total ?? 1,
    orderBook.asks[orderBook.asks.length - 1]?.total ?? 1
  )

  const bestBid = orderBook.bids[0]?.price
  const bestAsk = orderBook.asks[0]?.price
  const spread = bestBid != null && bestAsk != null ? bestAsk - bestBid : null
  const bidVolume = orderBook.bids[orderBook.bids.length - 1]?.total ?? 0
  const askVolume = orderBook.asks[orderBook.asks.length - 1]?.total ?? 0
  const totalVolume = bidVolume + askVolume
  const bidShare = totalVolume > 0 ? (bidVolume / totalVolume) * 100 : 50

  return (
    <Panel title="Стакан заявок" noPadding draggable={!!onRemove} onRemove={onRemove}>
      <div className="relative flex h-full flex-col text-xs">
        {!bookOpen && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-bg-panel text-center">
            <span className="font-medium text-text-secondary">Торги закрыты</span>
            {countdown && (
              <span className="font-tabular text-lg font-bold text-accent">{countdown}</span>
            )}
            <span className="text-[11px] text-text-muted">до открытия торгов</span>
          </div>
        )}
        <div className="shrink-0 border-b border-border-subtle px-2 pt-2">
          <OrderBookDepthChart bids={orderBook.bids} asks={orderBook.asks} />
        </div>

        <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-3 py-1.5 text-[11px]">
          <span className="text-text-muted">
            Спред <span className="font-tabular text-text-secondary">{spread != null ? formatPrice(spread) : '—'}</span>
          </span>
          <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-sell-bg" title="Дисбаланс bid/ask">
            <div className="h-full bg-buy" style={{ width: `${bidShare}%` }} />
          </div>
          <span className="font-tabular text-buy">{bidShare.toFixed(0)}%</span>
          <span className="text-text-muted">/</span>
          <span className="font-tabular text-sell">{(100 - bidShare).toFixed(0)}%</span>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-1 border-b border-border-subtle bg-bg-head px-3 py-1.5 text-[9px] uppercase tracking-wide text-text-muted">
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
