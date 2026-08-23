import { useState } from 'react'
import { Bell, ChevronDown, LineChart, Moon, Search, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/useThemeStore'
import { useMarketStore } from '@/store/useMarketStore'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { useViewStore } from '@/store/useViewStore'
import { InstrumentLogo } from '@/components/common/InstrumentLogo'
import { ViewMode } from '@/types'
import { formatMoney, formatPercent } from '@/lib/format'

const NAV_ITEMS: Array<{ value: ViewMode; label: string }> = [
  { value: 'terminal', label: 'Терминал' },
  { value: 'charts', label: 'Графики' },
  { value: 'analytics', label: 'Аналитика' },
  { value: 'reports', label: 'Отчёты' },
]

/** Верхняя панель терминала: логотип, навигация, поиск, баланс, уведомления, тема */
export function Header() {
  const { theme, toggleTheme } = useThemeStore()
  const { instruments, selectTicker } = useMarketStore()
  const { account } = usePortfolioStore()
  const { view, setView } = useViewStore()
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const filtered = query
    ? instruments.filter(
        (i) => i.ticker.toLowerCase().includes(query.toLowerCase()) || i.name.toLowerCase().includes(query.toLowerCase())
      )
    : []

  const pnlPositive = account.todayPnl >= 0

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border-color bg-bg-panel px-4">
      <div className="flex items-center gap-2 font-display font-extrabold text-text-primary">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
          <LineChart size={18} />
        </div>
        <span className="text-[17px]">Terminalfor</span>
      </div>

      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.value}
            onClick={() => setView(item.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === item.value ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="relative ml-2 w-72">
        <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
          placeholder="Поиск инструмента..."
          className="w-full rounded-md border border-border-color bg-bg-base py-1.5 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
        {searchFocused && filtered.length > 0 && (
          <div className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-md border border-border-color bg-bg-elevated shadow-panel">
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

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden flex-col items-end leading-tight sm:flex">
          <span className="font-tabular text-sm font-semibold text-text-primary">{formatMoney(account.equity)}</span>
          <span className={`font-tabular text-xs ${pnlPositive ? 'text-buy' : 'text-sell'}`}>
            {pnlPositive ? '+' : ''}
            {formatMoney(account.todayPnl)} ({formatPercent(account.todayPnlPercent)})
          </span>
        </div>

        <button
          onClick={toggleTheme}
          aria-label="Переключить тему"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border-color text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button className="relative flex h-8 w-8 items-center justify-center rounded-md border border-border-color text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary">
          <Bell size={16} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-sell" />
        </button>

        <button className="flex items-center gap-1.5 rounded-md border border-border-color py-1 pl-1 pr-2 hover:bg-bg-hover">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            КК
          </div>
          <ChevronDown size={14} className="text-text-muted" />
        </button>
      </div>
    </header>
  )
}
