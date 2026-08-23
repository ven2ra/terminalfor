import { useEffect, useMemo, useState } from 'react'
import { format, isToday, isTomorrow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarBlank, CurrencyCircleDollar, FlagCheckered, HandCoins } from '@phosphor-icons/react'
import { fetchCalendar } from '@/api/client'
import { useMarketStore } from '@/store/useMarketStore'
import { useViewStore } from '@/store/useViewStore'
import { SkeletonRows } from '@/components/common/Skeleton'
import { formatMoney } from '@/lib/format'
import { CalendarEvent } from '@/types'

const TYPE_META: Record<CalendarEvent['type'], { label: string; icon: typeof HandCoins; className: string }> = {
  coupon: { label: 'Купон', icon: HandCoins, className: 'text-accent-cyan' },
  offer: { label: 'Оферта', icon: CurrencyCircleDollar, className: 'text-warning' },
  maturity: { label: 'Погашение', icon: FlagCheckered, className: 'text-text-secondary' },
}

const FILTERS: Array<{ value: CalendarEvent['type'] | 'all'; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'coupon', label: 'Купоны' },
  { value: 'offer', label: 'Оферты' },
  { value: 'maturity', label: 'Погашения' },
]

function dayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  if (isToday(d)) return 'Сегодня'
  if (isTomorrow(d)) return 'Завтра'
  return format(d, 'd MMMM, EEEE', { locale: ru })
}

/**
 * Раздел «Календарь»: ближайшие оферты, купонные выплаты и погашения по
 * ликвидным облигациям МосБиржи. Дивиденды сюда не входят — у MOEX ISS
 * дивидендный календарь доступен только по платной подписке биржи, а
 * свободного API у сторонних источников нет (см. server/calendar.js).
 */
export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[] | null>(null)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<CalendarEvent['type'] | 'all'>('all')
  const { selectTicker } = useMarketStore()
  const { setView } = useViewStore()

  useEffect(() => {
    let cancelled = false
    fetchCalendar()
      .then((data) => {
        if (!cancelled) setEvents(data)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (!events) return []
    return filter === 'all' ? events : events.filter((e) => e.type === filter)
  }, [events, filter])

  const groups = useMemo(() => {
    const byDate = new Map<string, CalendarEvent[]>()
    for (const e of filtered) {
      if (!byDate.has(e.date)) byDate.set(e.date, [])
      byDate.get(e.date)!.push(e)
    }
    return [...byDate.entries()]
  }, [filtered])

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div>
          <h1 className="font-display text-lg font-bold text-text-primary">Календарь</h1>
          <p className="text-xs text-text-muted">
            Ближайшие купонные выплаты, оферты и погашения по ликвидным облигациям МосБиржи
          </p>
        </div>

        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === f.value ? 'bg-accent text-accent-contrast' : 'border border-border-color text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {events === null && !error && <SkeletonRows rows={10} />}

        {error && (
          <div className="rounded-md border border-sell bg-sell-bg px-3 py-2.5 text-sm text-sell">
            Не удалось загрузить календарь. Попробуйте обновить страницу.
          </div>
        )}

        {events !== null && !error && groups.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-text-muted">
            <CalendarBlank size={28} />
            <span className="text-sm">Ближайших событий этого типа не найдено</span>
          </div>
        )}

        {groups.map(([date, dayEvents]) => (
          <div key={date}>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">{dayLabel(date)}</div>
            <div className="overflow-hidden rounded-md border border-border-color">
              {dayEvents.map((e, i) => {
                const meta = TYPE_META[e.type]
                const Icon = meta.icon
                return (
                  <button
                    key={`${e.ticker}-${e.type}-${i}`}
                    onClick={() => {
                      selectTicker(e.ticker)
                      setView('terminal')
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-bg-hover ${
                      i > 0 ? 'border-t border-border-subtle' : ''
                    }`}
                  >
                    <Icon size={16} className={`shrink-0 ${meta.className}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-text-primary">{e.name}</div>
                      <div className="text-xs text-text-muted">{e.ticker}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={`text-xs font-medium ${meta.className}`}>{meta.label}</div>
                      {e.value != null && (
                        <div className="font-tabular text-xs text-text-secondary">{formatMoney(e.value, e.currency)}</div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
