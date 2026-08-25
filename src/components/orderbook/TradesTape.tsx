import { useMemo, useState } from 'react'
import { useMarketStore } from '@/store/useMarketStore'
import { Panel } from '@/components/common/Panel'
import { formatPrice } from '@/lib/format'
import { useMarketOpen, useMarketOpenCountdown } from '@/hooks/useMarketOpen'

interface TradesTapeProps {
  onRemove?: () => void
}

type Filter = 'all' | 'buy' | 'sell' | 'large'
const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'buy', label: 'Покупки' },
  { value: 'sell', label: 'Продажи' },
  { value: 'large', label: 'Крупные' },
]

/** Лента последних сделок по инструменту (реальные сделки с МосБиржи) */
export function TradesTape({ onRemove }: TradesTapeProps) {
  const { trades } = useMarketStore()
  const [filter, setFilter] = useState<Filter>('all')
  // Вне торговой сессии (будни 06:50–23:50 МСК, выходные — сессия выходного
  // дня 09:50–18:59) лента заморожена на последнем известном состоянии — показываем это явно
  const sessionOpen = useMarketOpen()
  const countdown = useMarketOpenCountdown()

  // "Крупная" сделка — заметно выше среднего объёма в текущей видимой ленте
  const largeThreshold = useMemo(() => {
    if (trades.length === 0) return Infinity
    const avg = trades.reduce((sum, t) => sum + t.size, 0) / trades.length
    return avg * 2.5
  }, [trades])

  const filtered = useMemo(() => {
    switch (filter) {
      case 'buy':
        return trades.filter((t) => t.side === 'buy')
      case 'sell':
        return trades.filter((t) => t.side === 'sell')
      case 'large':
        return trades.filter((t) => t.size >= largeThreshold)
      default:
        return trades
    }
  }, [trades, filter, largeThreshold])

  return (
    <Panel title="Лента сделок" noPadding draggable={!!onRemove} onRemove={onRemove}>
      <div className="relative flex h-full flex-col text-xs">
        {!sessionOpen && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-bg-panel text-center">
            <span className="font-medium text-text-secondary">Торги закрыты</span>
            {countdown && (
              <span className="font-tabular text-lg font-bold text-accent">{countdown}</span>
            )}
            <span className="text-[11px] text-text-muted">до открытия торгов</span>
          </div>
        )}
        <div className="flex shrink-0 gap-1 border-b border-border-subtle px-2 py-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded px-2 py-0.5 text-[11px] font-medium transition-all active:scale-95 ${
                filter === f.value ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="grid shrink-0 grid-cols-3 gap-1 border-b border-border-subtle bg-bg-head px-3 py-1.5 text-[9px] uppercase tracking-wide text-text-muted">
          <span>Время</span>
          <span className="text-right">Цена</span>
          <span className="text-right">Объём</span>
        </div>
        {sessionOpen && filtered.length === 0 && <div className="p-4 text-center text-text-muted">Нет сделок</div>}
        {sessionOpen && filtered.map((t) => {
          const large = t.size >= largeThreshold
          return (
            <div
              key={t.id}
              className={`grid animate-row-in grid-cols-3 gap-1 px-3 py-[3px] font-tabular animate-flash ${
                large ? (t.side === 'buy' ? 'bg-buy-bg font-semibold' : 'bg-sell-bg font-semibold') : ''
              }`}
            >
              <span className="text-text-muted">{t.time}</span>
              <span className={`text-right ${t.side === 'buy' ? 'text-buy' : 'text-sell'}`}>{formatPrice(t.price)}</span>
              <span className={`text-right ${large ? 'text-text-primary' : 'text-text-secondary'}`}>{t.size}</span>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
