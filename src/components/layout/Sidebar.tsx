import { useState } from 'react'
import { ChartBar, Bell, ChartLine, FileText, SquaresFour, Moon, Sun, Trash } from '@phosphor-icons/react'
import { useThemeStore } from '@/store/useThemeStore'
import { useViewStore } from '@/store/useViewStore'
import { useAlertsStore } from '@/store/useAlertsStore'
import { ViewMode } from '@/types'
import { formatPrice } from '@/lib/format'

const NAV_ITEMS: Array<{ value: ViewMode; label: string; icon: typeof SquaresFour }> = [
  { value: 'terminal', label: 'Терминал', icon: SquaresFour },
  { value: 'charts', label: 'Графики', icon: ChartLine },
  { value: 'analytics', label: 'Аналитика', icon: ChartBar },
  { value: 'reports', label: 'Отчёты', icon: FileText },
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
  const [notifOpen, setNotifOpen] = useState(false)

  const triggeredAlerts = alerts
    .filter((a) => a.triggeredAt != null)
    .sort((a, b) => (b.triggeredAt ?? 0) - (a.triggeredAt ?? 0))
  const unseenCount = triggeredAlerts.filter((a) => !a.seen).length

  return (
    <aside className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border-color bg-bg-panel py-3">
      {/* Фирменный знак — рамка-прицел вместо иконки из общей библиотеки: та же
          "уголковая" логика, что и на панелях, но в масштабе логотипа */}
      <svg width="26" height="26" viewBox="0 0 30 30" className="mb-4 shrink-0" aria-hidden>
        <path d="M2 9V3.5A1.5 1.5 0 0 1 3.5 2H9" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M28 9V3.5A1.5 1.5 0 0 0 26.5 2H21" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M2 21v5.5A1.5 1.5 0 0 0 3.5 28H9" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M28 21v5.5a1.5 1.5 0 0 1-1.5 1.5H21" stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="15" cy="15" r="3" fill="var(--accent)" />
      </svg>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.value}
            onClick={() => setView(item.value)}
            title={item.label}
            aria-label={item.label}
            className={`flex h-10 w-10 items-center justify-center transition-all active:scale-90 ${
              view === item.value
                ? 'bg-accent/15 text-accent'
                : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
            }`}
          >
            <item.icon size={18} />
          </button>
        ))}
      </nav>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label="Переключить тему"
          className="flex h-9 w-9 items-center justify-center text-text-secondary transition-all active:scale-90 hover:bg-bg-hover hover:text-text-primary"
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
            className="relative flex h-9 w-9 items-center justify-center text-text-secondary transition-all active:scale-90 hover:bg-bg-hover hover:text-text-primary"
          >
            <Bell size={16} />
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

        <button
          title="Аккаунт"
          aria-label="Аккаунт"
          className="flex h-8 w-8 items-center justify-center bg-accent text-xs font-bold text-accent-contrast transition-transform active:scale-90 hover:brightness-110"
        >
          КК
        </button>
      </div>
    </aside>
  )
}
