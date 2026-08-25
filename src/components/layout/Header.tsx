import { useEffect, useState } from 'react'
import { MagnifyingGlass, WifiSlash } from '@phosphor-icons/react'
import { useMarketStore } from '@/store/useMarketStore'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { useViewStore } from '@/store/useViewStore'
import { InstrumentLogo } from '@/components/common/InstrumentLogo'
import { formatMoney } from '@/lib/format'
import { useMarketOpen } from '@/hooks/useMarketOpen'

/** Секунд с последнего успешного обновления фида — тикается раз в секунду, только пока индикатор реально виден (status !== 'ready') */
function useSecondsSince(timestamp: number | null): number | null {
  const [, tick] = useState(0)
  useEffect(() => {
    if (timestamp === null) return
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [timestamp])
  if (timestamp === null) return null
  return Math.floor((Date.now() - timestamp) / 1000)
}

/** Индикатор состояния рыночного фида: скрыт, пока данные живые, иначе явно предупреждает — "молчаливого" зависшего фида быть не должно */
function FeedStatusIndicator() {
  const { status, lastUpdatedAt } = useMarketStore()
  const secondsStale = useSecondsSince(status === 'error' ? lastUpdatedAt : null)

  if (status !== 'error') return null

  return (
    <div
      className="flex shrink-0 items-center gap-1.5 border border-sell bg-sell-bg px-2 py-1 text-xs font-medium text-sell"
      role="status"
      title="Не удаётся обновить рыночные данные — цены могут быть неактуальны"
    >
      <WifiSlash size={13} weight="bold" />
      <span className="hidden sm:inline">
        Нет связи с биржей{secondsStale !== null && secondsStale > 0 ? ` · обновлено ${secondsStale} с назад` : ''}
      </span>
    </div>
  )
}

/** Тонкая верхняя строка терминала: поиск инструмента + текущий баланс/P&L. Навигация и аккаунт — в боковом рейле (Sidebar) */
export function Header() {
  const { instruments, selectTicker } = useMarketStore()
  const { account } = usePortfolioStore()
  const { setView } = useViewStore()
  const marketOpen = useMarketOpen()
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
    <header className="relative flex h-[46px] shrink-0 items-center gap-3 border-b border-border-color bg-bg-head px-3.5">
      <div className="shrink-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-text-primary">
        Terminalfor<em className="ml-1 font-medium not-italic text-accent">// терминал</em>
      </div>

      <div className="hidden shrink-0 items-center gap-1.5 border border-border-color bg-bg-head px-2.5 text-[11px] text-text-secondary lg:flex">
        <span className="font-semibold text-text-primary">Демо-счёт</span>
      </div>

      <div className="hidden items-stretch lg:flex">
        <div className="flex min-w-[110px] flex-col justify-center whitespace-nowrap border-l border-border-subtle px-3">
          <span className="text-[8px] uppercase tracking-wide text-text-muted">Стоимость портфеля</span>
          <span className="mt-0.5 font-tabular text-xs font-semibold text-text-primary">{formatMoney(account.equity)}</span>
        </div>
        <div className="flex min-w-[110px] flex-col justify-center whitespace-nowrap border-l border-border-subtle px-3">
          <span className="text-[8px] uppercase tracking-wide text-text-muted">Свободно</span>
          <span className="mt-0.5 font-tabular text-xs font-semibold text-text-primary">{formatMoney(account.availableMargin)}</span>
        </div>
        <div className="flex min-w-[110px] flex-col justify-center whitespace-nowrap border-l border-border-subtle px-3">
          <span className="text-[8px] uppercase tracking-wide text-text-muted">Прибыль за день</span>
          <span className={`mt-0.5 font-tabular text-xs font-semibold ${pnlPositive ? 'text-buy' : 'text-sell'}`}>
            {pnlPositive ? '+' : ''}
            {formatMoney(account.todayPnl)}
          </span>
        </div>
      </div>

      {/* Десктоп: поисковая строка всегда развёрнута */}
      <div className="relative ml-auto hidden w-72 md:block">
        <MagnifyingGlass size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
          placeholder="Поиск инструмента..."
          className="h-[30px] w-full border border-border-color bg-bg-head py-1.5 pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
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
                <InstrumentLogo ticker={i.ticker} isin={i.isin} size={20} isOfz={i.isOfz} />
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
                  <InstrumentLogo ticker={i.ticker} isin={i.isin} size={20} isOfz={i.isOfz} />
                  <span className="font-semibold">{i.ticker}</span>
                  <span className="ml-auto truncate text-text-muted">{i.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <FeedStatusIndicator />

      <div
        title={marketOpen ? 'Основная сессия МосБиржи идёт' : 'Биржа сейчас закрыта'}
        className="hidden shrink-0 items-center gap-1.5 border border-border-color bg-bg-head px-2.5 py-1.5 text-[9px] uppercase tracking-wide text-text-secondary lg:flex"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${marketOpen ? 'bg-buy' : 'bg-text-muted'}`} />
        RUS · {marketOpen ? 'Открыто' : 'Закрыто'}
      </div>

      <button className="hidden h-[30px] shrink-0 border-0 bg-accent px-3 text-[11px] font-bold text-accent-contrast transition-colors hover:bg-accent-hover sm:block">
        Пополнить
      </button>
    </header>
  )
}
