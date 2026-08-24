import { useMemo, useState } from 'react'
import { Minus, Plus, X } from '@phosphor-icons/react'
import { useMarketStore } from '@/store/useMarketStore'
import { useOrderStore } from '@/store/useOrderStore'
import { useInstrumentFlags } from '@/store/useInstrumentFlagsStore'
import { InstrumentLogo } from '@/components/common/InstrumentLogo'
import { ScalperMiniChart } from '@/components/scalper/ScalperMiniChart'
import { usePriceFlash } from '@/hooks/usePriceFlash'
import { synthesizeOrderBook } from '@/mock/orderbook'
import { formatPercent, formatPrice } from '@/lib/format'

interface ScalperColumnProps {
  ticker: string
  onRemove: () => void
}

/**
 * Одна колонка скальперского шаблона: быстрые кнопки покупки/продажи,
 * стакан и мини-график по одной бумаге — независимо от "основного"
 * выбранного тикера терминала, чтобы держать несколько инструментов
 * на экране одновременно (как в скальперских шаблонах брокерских
 * терминалов). Заявки — сразу рыночные, без экрана подтверждения:
 * смысл шаблона в скорости.
 */
export function ScalperColumn({ ticker, onRemove }: ScalperColumnProps) {
  const instrument = useMarketStore((s) => s.instruments.find((i) => i.ticker === ticker))
  const { placeOrder } = useOrderStore()
  const flags = useInstrumentFlags(ticker)
  const priceFlash = usePriceFlash(instrument?.lastPrice ?? 0)
  const [size, setSize] = useState(() => Math.max(instrument?.lotSize ?? 1, 1))
  const [flash, setFlash] = useState<'buy' | 'sell' | null>(null)

  const step = instrument?.lotSize ?? 1
  const positive = (instrument?.change ?? 0) >= 0
  const qualBlocked = !!flags?.isQualifiedOnly

  const orderBook = useMemo(() => {
    if (!instrument?.bid || !instrument?.offer) return null
    return synthesizeOrderBook(instrument.bid, instrument.offer, 8)
  }, [instrument?.bid, instrument?.offer])

  const handleTrade = (side: 'buy' | 'sell') => {
    if (!instrument || qualBlocked) return
    placeOrder({ ticker: instrument.ticker, side, type: 'market', price: instrument.lastPrice, size })
    setFlash(side)
    setTimeout(() => setFlash(null), 400)
  }

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r border-border-color bg-bg-panel">
      <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle bg-bg-head px-2.5 py-1.5">
        <InstrumentLogo ticker={ticker} isin={instrument?.isin ?? null} size={18} isOfz={instrument?.isOfz} />
        <span className="text-xs font-bold text-text-primary">{ticker}</span>
        {instrument && (
          <span
            className={`font-tabular text-xs ${priceFlash === 'up' ? 'animate-flash-up' : priceFlash === 'down' ? 'animate-flash-down' : ''}`}
          >
            {formatPrice(instrument.lastPrice)}
          </span>
        )}
        {instrument && (
          <span className={`font-tabular text-[10px] ${positive ? 'text-buy' : 'text-sell'}`}>
            {formatPercent(instrument.changePercent)}
          </span>
        )}
        <button onClick={onRemove} aria-label={`Убрать ${ticker} из шаблона`} className="ml-auto text-text-muted hover:text-sell">
          <X size={13} />
        </button>
      </div>

      {qualBlocked && (
        <div className="shrink-0 border-b border-sell bg-sell-bg px-2 py-1 text-center text-[10px] font-medium text-sell">
          Только для квал. инвесторов
        </div>
      )}

      <div className="flex shrink-0 items-center gap-1.5 border-b border-border-subtle px-2 py-1.5">
        <button
          onClick={() => handleTrade('buy')}
          disabled={!instrument || qualBlocked}
          className={`flex-1 rounded py-1.5 text-xs font-bold text-accent-contrast transition-transform active:scale-95 disabled:opacity-40 ${
            flash === 'buy' ? 'brightness-125' : ''
          } bg-buy hover:brightness-110`}
        >
          Купить
        </button>
        <button
          onClick={() => handleTrade('sell')}
          disabled={!instrument || qualBlocked}
          className={`flex-1 rounded py-1.5 text-xs font-bold text-accent-contrast transition-transform active:scale-95 disabled:opacity-40 ${
            flash === 'sell' ? 'brightness-125' : ''
          } bg-sell hover:brightness-110`}
        >
          Продать
        </button>
        <div className="flex shrink-0 items-stretch overflow-hidden rounded border border-border-color">
          <button
            onClick={() => setSize((s) => Math.max(step, s - step))}
            aria-label="Уменьшить объём"
            className="flex w-6 items-center justify-center bg-bg-elevated text-text-secondary hover:bg-bg-hover"
          >
            <Minus size={11} />
          </button>
          <span className="flex w-10 items-center justify-center bg-bg-base font-tabular text-[11px] text-text-primary">
            {size}
          </span>
          <button
            onClick={() => setSize((s) => s + step)}
            aria-label="Увеличить объём"
            className="flex w-6 items-center justify-center bg-bg-elevated text-text-secondary hover:bg-bg-hover"
          >
            <Plus size={11} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="h-[46%] min-h-0 overflow-hidden">
          {orderBook ? (
            <div className="flex h-full flex-col text-[11px]">
              <div className="flex flex-1 flex-col-reverse overflow-hidden">
                {orderBook.asks
                  .slice()
                  .reverse()
                  .map((level, idx) => (
                    <div key={`ask-${idx}`} className="relative grid grid-cols-2 gap-1 px-2 py-[1px] font-tabular">
                      <div className="absolute inset-y-0 right-0 bg-sell-bg" style={{ width: `${(level.total / orderBook.asks[orderBook.asks.length - 1].total) * 100}%` }} />
                      <span className="relative text-sell">{formatPrice(level.price)}</span>
                      <span className="relative text-right text-text-muted">{level.size}</span>
                    </div>
                  ))}
              </div>
              <div className="flex-1 overflow-hidden">
                {orderBook.bids.map((level, idx) => (
                  <div key={`bid-${idx}`} className="relative grid grid-cols-2 gap-1 px-2 py-[1px] font-tabular">
                    <div className="absolute inset-y-0 right-0 bg-buy-bg" style={{ width: `${(level.total / orderBook.bids[orderBook.bids.length - 1].total) * 100}%` }} />
                    <span className="relative text-buy">{formatPrice(level.price)}</span>
                    <span className="relative text-right text-text-muted">{level.size}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-[11px] text-text-muted">Нет котировок</div>
          )}
        </div>
        <div className="h-[54%] min-h-0 border-t border-border-subtle">
          <ScalperMiniChart ticker={ticker} />
        </div>
      </div>
    </div>
  )
}
