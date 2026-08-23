import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp } from '@phosphor-icons/react'
import { useMarketStore } from '@/store/useMarketStore'
import { useViewStore } from '@/store/useViewStore'
import { Panel } from '@/components/common/Panel'
import { SkeletonRows } from '@/components/common/Skeleton'
import { formatCompact, formatPercent, formatPrice } from '@/lib/format'
import { Instrument } from '@/types'

type SortKey = 'changePercent' | 'turnover' | 'lastPrice'

function TopList({ title, items, positive }: { title: string; items: Instrument[]; positive: boolean }) {
  const { selectTicker } = useMarketStore()
  const { setView } = useViewStore()

  return (
    <div className="rounded-lg border border-border-color bg-bg-elevated p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        {positive ? <ArrowUp size={13} className="text-buy" /> : <ArrowDown size={13} className="text-sell" />}
        {title}
      </div>
      <div className="flex flex-col gap-1">
        {items.map((i) => (
          <button
            key={i.ticker}
            onClick={() => {
              selectTicker(i.ticker)
              setView('terminal')
            }}
            className="flex items-center justify-between rounded px-1.5 py-1 text-xs hover:bg-bg-hover"
          >
            <span className="font-medium text-text-primary">{i.ticker}</span>
            <span className={`font-tabular font-semibold ${positive ? 'text-buy' : 'text-sell'}`}>
              {formatPercent(i.changePercent)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Раздел «Аналитика»: скринер всего рынка МосБиржи — лидеры роста/падения и таблица по всем бумагам */
export function AnalyticsView() {
  const { instruments, status, selectTicker } = useMarketStore()
  const { setView } = useViewStore()
  const [sortKey, setSortKey] = useState<SortKey>('turnover')
  const [query, setQuery] = useState('')

  const gainers = useMemo(
    () => [...instruments].sort((a, b) => b.changePercent - a.changePercent).slice(0, 8),
    [instruments]
  )
  const losers = useMemo(
    () => [...instruments].sort((a, b) => a.changePercent - b.changePercent).slice(0, 8),
    [instruments]
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? instruments.filter((i) => i.ticker.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))
      : instruments
    return [...filtered].sort((a, b) => b[sortKey] - a[sortKey])
  }, [instruments, sortKey, query])

  const sortButton = (key: SortKey, label: string) => (
    <button
      onClick={() => setSortKey(key)}
      className={`font-medium ${sortKey === key ? 'text-accent' : 'text-text-muted hover:text-text-secondary'}`}
    >
      {label}
    </button>
  )

  return (
    <div className="h-full overflow-auto p-4">
      {status === 'loading' && instruments.length === 0 ? (
        <SkeletonRows rows={10} />
      ) : (
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TopList title="Лидеры роста" items={gainers} positive />
            <TopList title="Лидеры падения" items={losers} positive={false} />
          </div>

          <Panel
            title={`Все бумаги · ${rows.length}`}
            noPadding
            className="rounded-lg border border-border-color"
            actions={
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Фильтр по тикеру или названию"
                className="w-56 rounded border border-border-color bg-bg-base px-2 py-1 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            }
          >
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-bg-panel">
                <tr className="border-b border-border-subtle text-left text-text-muted">
                  <th className="px-3 py-2 font-medium">Тикер</th>
                  <th className="px-3 py-2 font-medium">Название</th>
                  <th className="px-3 py-2 text-right">{sortButton('lastPrice', 'Цена')}</th>
                  <th className="px-3 py-2 text-right">{sortButton('changePercent', 'Изм. %')}</th>
                  <th className="px-3 py-2 text-right">{sortButton('turnover', 'Оборот')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr
                    key={i.ticker}
                    onClick={() => {
                      selectTicker(i.ticker)
                      setView('terminal')
                    }}
                    className="cursor-pointer border-b border-border-subtle hover:bg-bg-hover"
                  >
                    <td className="px-3 py-1.5 font-semibold text-text-primary">{i.ticker}</td>
                    <td className="px-3 py-1.5 text-text-secondary">{i.name}</td>
                    <td className="px-3 py-1.5 text-right font-tabular text-text-primary">{formatPrice(i.lastPrice)}</td>
                    <td
                      className={`px-3 py-1.5 text-right font-tabular font-semibold ${
                        i.changePercent >= 0 ? 'text-buy' : 'text-sell'
                      }`}
                    >
                      {formatPercent(i.changePercent)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-tabular text-text-muted">
                      {formatCompact(i.turnover)} ₽
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      )}
    </div>
  )
}
