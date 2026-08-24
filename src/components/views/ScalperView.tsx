import { useState } from 'react'
import { Lightning, MagnifyingGlass, Plus } from '@phosphor-icons/react'
import { useMarketStore } from '@/store/useMarketStore'
import { useScalperStore } from '@/store/useScalperStore'
import { ScalperColumn } from '@/components/scalper/ScalperColumn'

/** Скальперский шаблон: несколько инструментов колонками — стакан, мини-график и быстрые Купить/Продать по каждому одновременно */
export function ScalperView() {
  const { tickers, addTicker, removeTicker } = useScalperStore()
  const instruments = useMarketStore((s) => s.instruments)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const matches = query.trim()
    ? instruments
        .filter(
          (i) =>
            !tickers.includes(i.ticker) &&
            (i.ticker.toLowerCase().includes(query.toLowerCase()) || i.name.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 8)
    : []

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex shrink-0 items-center gap-2 border-b border-border-subtle bg-bg-head px-3 py-2">
        <Lightning size={14} className="text-accent" />
        <span className="text-xs font-bold uppercase tracking-wide text-text-primary">Скальперский шаблон</span>
        <div className="relative ml-auto">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border border-border-color px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <Plus size={13} /> Добавить бумагу
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-1 w-64 overflow-hidden rounded-md border border-border-color bg-bg-elevated shadow-panel">
                <div className="relative p-2">
                  <MagnifyingGlass size={13} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Тикер или название…"
                    className="w-full rounded border border-border-color bg-bg-base py-1.5 pl-7 pr-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="max-h-64 overflow-auto border-t border-border-subtle">
                  {matches.length === 0 && (
                    <div className="px-3 py-3 text-center text-xs text-text-muted">
                      {query.trim() ? 'Ничего не найдено' : 'Начните вводить тикер'}
                    </div>
                  )}
                  {matches.map((i) => (
                    <button
                      key={i.ticker}
                      onClick={() => {
                        addTicker(i.ticker)
                        setQuery('')
                        setOpen(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-bg-hover"
                    >
                      <span className="font-semibold text-text-primary">{i.ticker}</span>
                      <span className="truncate text-text-muted">{i.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {tickers.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-text-muted">
          <Lightning size={28} className="opacity-40" />
          <span className="text-sm">Добавьте бумаги, чтобы начать</span>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 overflow-x-auto">
          {tickers.map((ticker) => (
            <ScalperColumn key={ticker} ticker={ticker} onRemove={() => removeTicker(ticker)} />
          ))}
        </div>
      )}
    </div>
  )
}
