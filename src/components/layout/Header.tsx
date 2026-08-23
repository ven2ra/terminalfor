import { useState } from 'react'
import {
  BarChart2,
  Bell,
  CandlestickChart,
  ChevronDown,
  FileText,
  LayoutGrid,
  LineChart,
  Moon,
  Search,
  Sun,
  Trash2,
} from 'lucide-react'
import { useThemeStore } from '@/store/useThemeStore'
import { useMarketStore } from '@/store/useMarketStore'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { useViewStore } from '@/store/useViewStore'
import { useAlertsStore } from '@/store/useAlertsStore'
import { InstrumentLogo } from '@/components/common/InstrumentLogo'
import { ViewMode } from '@/types'
import { formatMoney, formatPercent, formatPrice } from '@/lib/format'

const NAV_ITEMS: Array<{ value: ViewMode; label: string; icon: typeof LayoutGrid }> = [
  { value: 'terminal', label: 'Терминал', icon: LayoutGrid },
  { value: 'charts', label: 'Графики', icon: CandlestickChart },
  { value: 'analytics', label: 'Аналитика', icon: BarChart2 },
  { value: 'reports', label: 'Отчёты', icon: FileText },
]

/** Верхняя панель терминала: логотип, навигация, поиск, баланс, уведомления, тема */
export function Header() {
  const { theme, toggleTheme } = useThemeStore()
  const { instruments, selectTicker } = useMarketStore()
  const { account } = usePortfolioStore()
  const { view, setView } = useViewStore()
  const { alerts, removeAlert, markAllSeen } = useAlertsStore()
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const triggeredAlerts = alerts
    .filter((a) => a.triggeredAt != null)
    .sort((a, b) => (b.triggeredAt ?? 0) - (a.triggeredAt ?? 0))
  const unseenCount = triggeredAlerts.filter((a) => !a.seen).length

  const filtered = query
    ? instruments.filter(
        (i) => i.ticker.toLowerCase().includes(query.toLowerCase()) || i.name.toLowerCase().includes(query.toLowerCase())
      )
    : []

  const pnlPositive = account.todayPnl >= 0

  return (
    <header className="relative flex h-14 shrink-0 items-center gap-2 border-b border-border-color bg-bg-panel px-2 sm:gap-4 sm:px-4">
      <div className="flex shrink-0 items-center gap-2 font-display font-extrabold text-text-primary">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
          <LineChart size={18} />
        </div>
        <span className="hidden text-[17px] sm:inline">Terminalfor</span>
      </div>

      <nav className="flex items-center gap-0.5 sm:gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.value}
            onClick={() => setView(item.value)}
            title={item.label}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors sm:px-3 ${
              view === item.value ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
            }`}
          >
            <item.icon size={15} className="md:hidden" />
            <span className="hidden md:inline">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Десктоп: поисковая строка всегда развёрнута */}
      <div className="relative ml-2 hidden w-72 md:block">
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

      {/* Мобиль/планшет: поиск сворачивается в кнопку-иконку, разворачивается оверлеем под шапкой */}
      <button
        onClick={() => setMobileSearchOpen((v) => !v)}
        aria-label="Поиск инструмента"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-color text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary md:hidden"
      >
        <Search size={15} />
      </button>

      {mobileSearchOpen && (
        <div className="absolute left-0 right-0 top-full z-40 border-b border-border-color bg-bg-panel p-2 shadow-panel md:hidden">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск инструмента..."
              className="w-full rounded-md border border-border-color bg-bg-base py-1.5 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>
          {filtered.length > 0 && (
            <div className="mt-1 max-h-72 overflow-auto rounded-md border border-border-color bg-bg-elevated">
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

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
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

        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v)
              if (!notifOpen) markAllSeen()
            }}
            aria-label="Уведомления по алертам"
            className="relative flex h-8 w-8 items-center justify-center rounded-md border border-border-color text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <Bell size={16} />
            {unseenCount > 0 && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-sell" />}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-1 w-72 overflow-hidden rounded-md border border-border-color bg-bg-elevated shadow-panel">
                <div className="border-b border-border-subtle px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Сработавшие алерты
                </div>
                <div className="max-h-72 overflow-auto">
                  {triggeredAlerts.length === 0 && (
                    <div className="px-3 py-4 text-center text-xs text-text-muted">Пока ничего не сработало</div>
                  )}
                  {triggeredAlerts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-2 border-b border-border-subtle px-3 py-2 text-xs last:border-b-0">
                      <div>
                        <span className="font-semibold text-text-primary">{a.ticker}</span>{' '}
                        <span className="text-text-muted">{a.condition === 'above' ? 'выше' : 'ниже'}</span>{' '}
                        <span className="font-tabular text-text-secondary">{formatPrice(a.targetPrice)}</span>
                      </div>
                      <button
                        onClick={() => removeAlert(a.id)}
                        aria-label="Удалить алерт"
                        className="shrink-0 text-text-muted transition-colors hover:text-sell"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

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
