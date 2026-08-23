import { Star } from 'lucide-react'
import { useMarketStore } from '@/store/useMarketStore'
import { Panel } from '@/components/common/Panel'
import { formatPercent, formatPrice } from '@/lib/format'

/** Список инструментов слева: избранное, цена, изменение за день */
export function Watchlist() {
  const { instruments, selectedTicker, selectTicker, toggleFavorite } = useMarketStore()

  const sorted = [...instruments].sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite))

  return (
    <Panel title="Инструменты" noPadding>
      <div className="flex flex-col">
        {sorted.map((inst) => {
          const positive = inst.change >= 0
          const active = inst.ticker === selectedTicker
          return (
            <button
              key={inst.ticker}
              onClick={() => selectTicker(inst.ticker)}
              className={`group flex items-center gap-2 border-b border-border-subtle px-3 py-2 text-left transition-colors ${
                active ? 'bg-bg-hover' : 'hover:bg-bg-hover'
              }`}
            >
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite(inst.ticker)
                }}
                className="shrink-0"
              >
                <Star
                  size={14}
                  className={inst.isFavorite ? 'fill-accent text-accent' : 'text-text-muted opacity-0 group-hover:opacity-100'}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-primary">{inst.ticker}</span>
                  <span className="font-tabular text-sm text-text-primary">{formatPrice(inst.lastPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="truncate text-xs text-text-muted">{inst.name}</span>
                  <span className={`font-tabular text-xs ${positive ? 'text-buy' : 'text-sell'}`}>
                    {formatPercent(inst.changePercent)}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
