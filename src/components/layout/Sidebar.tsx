import { useState } from 'react'
import { CalendarBlank, ChartBar, Bell, ChartLine, FileText, Lightning, SquaresFour, Moon, Sun, Trash } from '@phosphor-icons/react'
import { useThemeStore } from '@/store/useThemeStore'
import { useViewStore } from '@/store/useViewStore'
import { useAlertsStore } from '@/store/useAlertsStore'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { ViewMode } from '@/types'
import { formatMoney, formatPercent, formatPrice } from '@/lib/format'

const NAV_ITEMS: Array<{ value: ViewMode; label: string; icon: typeof SquaresFour }> = [
  { value: 'terminal', label: 'Терминал', icon: SquaresFour },
  { value: 'scalper', label: 'Скальперский', icon: Lightning },
  { value: 'charts', label: 'Графики', icon: ChartLine },
  { value: 'analytics', label: 'Аналитика', icon: ChartBar },
  { value: 'reports', label: 'Отчёты', icon: FileText },
  { value: 'calendar', label: 'Календарь', icon: CalendarBlank },
]

/**
 * Боковая icon-rail панель — каркас навигации терминала вместо верхнего меню
 * (как в Bloomberg/IBKR/Binance): логотип, разделы, тема, алерты, аккаунт.
 * Постоянно видима на всех разрешениях, чтобы навигация не "переезжала"
 * между десктопом и мобильным видом.
 */
export function Sidebar() {
  const { theme, toggleTheme } = useThemeStore()
  const { view, setView } = useViewStore()
  const { alerts, removeAlert, markAllSeen } = useAlertsStore()
  const { account } = usePortfolioStore()
  const [notifOpen, setNotifOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const pnlPositive = account.todayPnl >= 0

  const triggeredAlerts = alerts
    .filter((a) => a.triggeredAt != null)
    .sort((a, b) => (b.triggeredAt ?? 0) - (a.triggeredAt ?? 0))
  const unseenCount = triggeredAlerts.filter((a) => !a.seen).length

  return (
    <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border-color bg-bg-rail py-2">
      {/* Фирменный знак — повёрнутый амберовый квадрат, как в исходном макете терминала */}
      <div className="mb-2.5 mt-0.5 grid h-7 w-7 shrink-0 rotate-45 place-items-center bg-accent" aria-hidden>
        <span className="-rotate-45 text-[13px] font-bold text-accent-contrast">T</span>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.value}
            onClick={() => setView(item.value)}
            title={item.label}
            aria-label={item.label}
            className={`relative flex h-[34px] w-[34px] items-center justify-center rounded-sm transition-all active:scale-90 ${
              view === item.value
                ? 'bg-accent/[.09] text-accent before:absolute before:-left-2 before:top-[9px] before:h-4 before:w-0.5 before:bg-accent before:content-[\'\']'
                : 'text-text-muted hover:bg-bg-hover hover:text-text-secondary'
            }`}
          >
            <item.icon size={16} />
          </button>
        ))}
      </nav>

      <div className="flex flex-col items-center gap-1">
        <button
          onClick={toggleTheme}
          aria-label="Переключить тему"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-sm text-text-muted transition-all active:scale-90 hover:bg-bg-hover hover:text-text-secondary"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((v) => !v)
              if (!notifOpen) markAllSeen()
            }}
            aria-label="Уведомления по алертам"
            className="relative flex h-[34px] w-[34px] items-center justify-center rounded-sm text-text-muted transition-all active:scale-90 hover:bg-bg-hover hover:text-text-secondary"
          >
            <Bell size={15} />
            {unseenCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sell" />}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div className="absolute bottom-0 left-full z-40 ml-2 w-72 overflow-hidden border border-border-color bg-bg-elevated shadow-panel">
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
                        <Trash size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setAccountOpen((v) => !v)}
            title="Аккаунт"
            aria-label="Аккаунт"
            aria-expanded={accountOpen}
            className="mt-1 flex h-7 w-7 items-center justify-center border border-border-color bg-bg-raised text-[9px] font-bold text-text-secondary transition-transform active:scale-90 hover:border-accent hover:text-accent"
          >
            КК
          </button>

          {accountOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setAccountOpen(false)} />
              <div className="absolute bottom-0 left-full z-40 ml-2 w-56 overflow-hidden border border-border-color bg-bg-elevated shadow-panel">
                <div className="border-b border-border-subtle px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Аккаунт
                </div>
                <div className="px-3 py-2.5">
                  <div className="text-[11px] uppercase tracking-wide text-text-muted">Капитал</div>
                  <div className="font-tabular text-base font-bold text-text-primary">{formatMoney(account.equity)}</div>
                  <div className={`mt-1 font-tabular text-xs font-medium ${pnlPositive ? 'text-buy' : 'text-sell'}`}>
                    {pnlPositive ? '+' : ''}
                    {formatMoney(account.todayPnl)} ({formatPercent(account.todayPnlPercent)}) сегодня
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
