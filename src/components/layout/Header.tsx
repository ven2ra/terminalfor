import { useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { useMarketStore } from '@/store/useMarketStore'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { useViewStore } from '@/store/useViewStore'
import { InstrumentLogo } from '@/components/common/InstrumentLogo'
import { formatMoney, formatPercent } from '@/lib/format'

/** Тонкая верхняя строка терминала: поиск инструмента + текущий баланс/P&L. Навигация и аккаунт — в боковом рейле (Sidebar) */
export function Header() {
  const { instruments, selectTicker } = useMarketStore()
  const { account } = usePortfolioStore()
  const { setView } = useViewStore()
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const filtered = query
    ? instruments.filter(
        (i) => i.ticker.toLowerCase().includes(query.toLowerCase()) || i.name.toLowerCase().includes(query.toLowerCase())
      )
    : []

  const pnlPositive = account.todayPnl >= 0

  return (
    <header className="relative flex h-12 shrink-0 items-center gap-2 border-b border-border-color bg-bg-panel px-3">
      {/* Десктоп: поисковая строка всегда развёрнута */}
      <div className="relative hidden w-80 md:block">
        <MagnifyingGlass size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
          placeholder="Поиск инструмента..."
          className="w-full border border-border-color bg-bg-base py-1.5 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
        {searchFocused && filtered.length > 0 && (
          <div className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden border border-border-color bg-bg-elevated shadow-panel">
            {filtered.slice(0, 6).map((i) => (
              <button
                key={i.ticker}
                onMouseDown={() => {
                  selectTicker(i.ticker)
                  setQuery('')
                  setView('terminal')
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-bg-hover"
              >
                <InstrumentLogo ticker={i.ticker} isin={i.isin} size={20} />
                <span className="font-semibold">{i.ticker}</span>
                <span className="ml-auto truncate text-text-muted">{i.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Мобиль/планшет: поиск сворачивается в кнопку-иконку, разворачивается оверлеем под шапкой */}
      <button
        onClick={() => setMobileSearchOpen((v) => !v)}
        aria-label="Поиск инструмента"
        className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-color text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary md:hidden"
      >
        <MagnifyingGlass size={15} />
      </button>

      {mobileSearchOpen && (
        <div className="absolute left-0 right-0 top-full z-40 border-b border-border-color bg-bg-panel p-2 shadow-panel md:hidden">
          <div className="relative">
            <MagnifyingGlass size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск инструмента..."
              className="w-full border border-border-color bg-bg-base py-1.5 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>
          {filtered.length > 0 && (
            <div className="mt-1 max-h-72 overflow-auto border border-border-color bg-bg-elevated">
              {filtered.slice(0, 8).map((i) => (
                <button
                  key={i.ticker}
                  onClick={() => {
                    selectTicker(i.ticker)
                    setQuery('')
                    setView('terminal')
                    setMobileSearchOpen(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-bg-hover"
                >
                  <InstrumentLogo ticker={i.ticker} isin={i.isin} size={20} />
                  <span className="font-semibold">{i.ticker}</span>
                  <span className="ml-auto truncate text-text-muted">{i.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="ml-auto flex items-center leading-tight">
        <span className="font-tabular text-sm font-semibold text-text-primary">{formatMoney(account.equity)}</span>
        <span className={`ml-2 font-tabular text-xs ${pnlPositive ? 'text-buy' : 'text-sell'}`}>
          {pnlPositive ? '+' : ''}
          {formatMoney(account.todayPnl)} ({formatPercent(account.todayPnlPercent)})
        </span>
      </div>
    </header>
  )
}
