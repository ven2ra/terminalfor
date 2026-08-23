import { useMemo, useState } from 'react'
import { Search, Star } from 'lucide-react'
import { useMarketStore } from '@/store/useMarketStore'
import { usePriceHistoryStore } from '@/store/usePriceHistoryStore'
import { Panel } from '@/components/common/Panel'
import { SkeletonRows } from '@/components/common/Skeleton'
import { InstrumentLogo } from '@/components/common/InstrumentLogo'
import { Sparkline } from '@/components/common/Sparkline'
import { usePriceFlash } from '@/hooks/usePriceFlash'
import { formatPercent, formatPrice } from '@/lib/format'
import { AssetType, Instrument } from '@/types'

interface WatchlistProps {
  onRemove?: () => void
}

interface RowProps {
  inst: Instrument
  active: boolean
  onSelect: () => void
  onToggleFavorite: () => void
}

const TABS: Array<{ value: AssetType | 'all'; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'share', label: 'Акции' },
  { value: 'fund', label: 'Фонды' },
  { value: 'bond', label: 'Облигации' },
  { value: 'future', label: 'Фьючерсы' },
]

/** Отдельный компонент строки — usePriceFlash обязан жить в собственном инстансе на каждый тикер */
function WatchlistRow({ inst, active, onSelect, onToggleFavorite }: RowProps) {
  const positive = inst.change >= 0
  const priceFlash = usePriceFlash(inst.lastPrice)
  const priceSuffix = inst.priceUnit === 'percent' ? '%' : ''
  const sparkValues = usePriceHistoryStore((s) => (inst.isFavorite ? s.history[inst.ticker] : undefined))

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
            {priceSuffix}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-text-muted">{inst.name}</span>
          <div className="flex shrink-0 items-center gap-2">
            {inst.isFavorite && sparkValues && sparkValues.length >= 2 && (
              <Sparkline values={sparkValues} width={44} height={16} />
            )}
            <span className={`font-tabular text-xs ${positive ? 'text-buy' : 'text-sell'}`}>
              {formatPercent(inst.changePercent)}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

/** Список инструментов слева: акции, фонды, облигации и фьючерсы МосБиржи, с фильтром по типу и поиском */
export function Watchlist({ onRemove }: WatchlistProps) {
  const { instruments, selectedTicker, selectTicker, toggleFavorite, status } = useMarketStore()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<AssetType | 'all'>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = tab === 'all' ? instruments : instruments.filter((i) => i.assetType === tab)
    if (q) list = list.filter((i) => i.ticker.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))
    return [...list].sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite))
  }, [instruments, query, tab])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: instruments.length }
    for (const i of instruments) c[i.assetType] = (c[i.assetType] ?? 0) + 1
    return c
  }, [instruments])

  return (
    <Panel
      title="Инструменты МосБиржи"
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
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border-subtle px-2 py-1.5">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`shrink-0 whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium transition-colors ${
              tab === t.value ? 'bg-accent text-white' : 'text-text-secondary hover:bg-bg-hover'
            }`}
          >
            {t.label}
            {counts[t.value] ? <span className="ml-1 opacity-70">{counts[t.value]}</span> : null}
          </button>
        ))}
      </div>

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
