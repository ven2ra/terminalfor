import { useMemo, useState } from 'react'
import { Search, Star } from 'lucide-react'
import { useMarketStore } from '@/store/useMarketStore'
import { Panel } from '@/components/common/Panel'
import { SkeletonRows } from '@/components/common/Skeleton'
import { InstrumentLogo } from '@/components/common/InstrumentLogo'
import { usePriceFlash } from '@/hooks/usePriceFlash'
import { formatPercent, formatPrice } from '@/lib/format'
import { Instrument } from '@/types'

interface WatchlistProps {
  onRemove?: () => void
}

interface RowProps {
  inst: Instrument
  active: boolean
  onSelect: () => void
  onToggleFavorite: () => void
}

/** Отдельный компонент строки — usePriceFlash обязан жить в собственном инстансе на каждый тикер */
function WatchlistRow({ inst, active, onSelect, onToggleFavorite }: RowProps) {
  const positive = inst.change >= 0
  const priceFlash = usePriceFlash(inst.lastPrice)

  return (
    <button
      onClick={onSelect}
      className={`group flex items-center gap-2 border-b border-border-subtle px-3 py-2 text-left transition-colors ${
        active ? 'bg-bg-hover' : 'hover:bg-bg-hover'
      }`}
    >
      <span
        role="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite()
        }}
        className="shrink-0"
      >
        <Star
          size={14}
          className={inst.isFavorite ? 'fill-accent text-accent' : 'text-text-muted opacity-0 group-hover:opacity-100'}
        />
      </span>
      <InstrumentLogo ticker={inst.ticker} isin={inst.isin} size={26} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary">{inst.ticker}</span>
          <span
            className={`rounded font-tabular text-sm text-text-primary ${
              priceFlash === 'up' ? 'animate-flash-up' : priceFlash === 'down' ? 'animate-flash-down' : ''
            }`}
          >
            {formatPrice(inst.lastPrice)}
          </span>
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
}

/** Список инструментов слева: весь основной режим торгов МосБиржи (TQBR), поиск, избранное */
export function Watchlist({ onRemove }: WatchlistProps) {
  const { instruments, selectedTicker, selectTicker, toggleFavorite, status } = useMarketStore()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? instruments.filter((i) => i.ticker.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))
      : instruments
    return [...list].sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite))
  }, [instruments, query])

  return (
    <Panel
      title={`Инструменты МосБиржи${instruments.length ? ` · ${instruments.length}` : ''}`}
      noPadding
      draggable={!!onRemove}
      onRemove={onRemove}
      actions={
        <div className="relative">
          <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Фильтр"
            className="w-24 rounded border border-border-color bg-bg-base py-1 pl-6 pr-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>
      }
    >
      {status === 'loading' && instruments.length === 0 ? (
        <div className="p-3">
          <SkeletonRows rows={10} />
        </div>
      ) : (
        <div className="flex flex-col">
          {filtered.map((inst) => (
            <WatchlistRow
              key={inst.ticker}
              inst={inst}
              active={inst.ticker === selectedTicker}
              onSelect={() => selectTicker(inst.ticker)}
              onToggleFavorite={() => toggleFavorite(inst.ticker)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="p-4 text-center text-xs text-text-muted">Ничего не найдено</div>
          )}
        </div>
      )}
    </Panel>
  )
}
