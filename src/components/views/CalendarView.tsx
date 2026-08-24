import { useEffect, useMemo, useState } from 'react'
import { differenceInCalendarDays, format, isToday, isTomorrow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarBlank, CurrencyCircleDollar, FlagCheckered, HandCoins } from '@phosphor-icons/react'
import { fetchCalendar } from '@/api/client'
import { useMarketStore } from '@/store/useMarketStore'
import { useViewStore } from '@/store/useViewStore'
import { InstrumentLogo } from '@/components/common/InstrumentLogo'
import { SkeletonRows } from '@/components/common/Skeleton'
import { formatMoney } from '@/lib/format'
import { CalendarEvent } from '@/types'

const TYPE_META: Record<CalendarEvent['type'], { label: string; icon: typeof HandCoins; dot: string; chip: string }> = {
  coupon: { label: 'Купон', icon: HandCoins, dot: 'bg-accent-cyan', chip: 'bg-accent-cyan/10 text-accent-cyan' },
  offer: { label: 'Оферта', icon: CurrencyCircleDollar, dot: 'bg-warning', chip: 'bg-warning-bg text-warning' },
  maturity: { label: 'Погашение', icon: FlagCheckered, dot: 'bg-text-secondary', chip: 'bg-bg-elevated text-text-secondary' },
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

function daysUntilLabel(dateStr: string): string {
  const n = differenceInCalendarDays(new Date(`${dateStr}T00:00:00`), new Date(new Date().toDateString()))
  if (n <= 0) return 'сегодня'
  if (n === 1) return 'завтра'
  if (n >= 2 && n <= 4) return `через ${n} дня`
  return `через ${n} дней`
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

  const stats = useMemo(() => {
    if (!events) return null
    const today = new Date(new Date().toDateString())
    const within7 = events.filter((e) => {
      const d = differenceInCalendarDays(new Date(`${e.date}T00:00:00`), today)
      return d >= 0 && d <= 7
    })
    // Сумма купонов разных бумаг математически бессмысленна — это цена за
    // ОДНУ облигацию у каждого эмитента (разный номинал/лот), а не сумма
    // реальных выплат по чьему-то портфелю. Вместо фиктивного "итого"
    // показываем самую крупную отдельную выплату периода — сравнение двух
    // "цена за бумагу" величин между собой корректно, в отличие от их суммы
    const biggestPayout = within7
      .filter((e) => e.type !== 'maturity' && e.value != null)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0]
    const nextEvent = events[0]
    return {
      total: events.length,
      within7: within7.length,
      biggestPayout,
      nextLabel: nextEvent ? dayLabel(nextEvent.date) : '—',
    }
  }, [events])

  return (
    <div className="h-full overflow-auto bg-bg-base p-5">
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-text-primary">Календарь</h1>
          <p className="mt-0.5 text-xs text-text-muted">
            Ближайшие купонные выплаты, оферты и погашения по ликвидным облигациям МосБиржи
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-2.5">
            <div className="relative overflow-hidden border border-border-color bg-bg-panel px-3.5 py-2.5 before:absolute before:left-0 before:top-0 before:h-0.5 before:w-7 before:bg-accent before:content-['']">
              <div className="text-[9px] uppercase tracking-wide text-text-muted">Ближайшее событие</div>
              <div className="mt-1 font-tabular text-base font-bold text-text-primary">{stats.nextLabel}</div>
            </div>
            <div className="relative overflow-hidden border border-border-color bg-bg-panel px-3.5 py-2.5 before:absolute before:left-0 before:top-0 before:h-0.5 before:w-7 before:bg-accent before:content-['']">
              <div className="text-[9px] uppercase tracking-wide text-text-muted">Событий в ближайшие 7 дней</div>
              <div className="mt-1 font-tabular text-base font-bold text-text-primary">{stats.within7}</div>
            </div>
            <div className="relative overflow-hidden border border-border-color bg-bg-panel px-3.5 py-2.5 before:absolute before:left-0 before:top-0 before:h-0.5 before:w-7 before:bg-accent before:content-['']">
              <div className="text-[9px] uppercase tracking-wide text-text-muted">Крупнейшая выплата на бумагу, 7 дней</div>
              {stats.biggestPayout ? (
                <>
                  <div className="mt-1 font-tabular text-base font-bold text-buy">
                    {formatMoney(stats.biggestPayout.value ?? 0, stats.biggestPayout.currency)}
                  </div>
                  <div className="truncate text-[10px] text-text-muted">{stats.biggestPayout.name}</div>
                </>
              ) : (
                <div className="mt-1 font-tabular text-base font-bold text-text-muted">—</div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-1 border-b border-border-subtle">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`border-b-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                filter === f.value ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {events === null && !error && <SkeletonRows rows={10} />}

        {error && (
          <div className="border border-sell bg-sell-bg px-3 py-2.5 text-sm text-sell">
            Не удалось загрузить календарь. Попробуйте обновить страницу.
          </div>
        )}

        {events !== null && !error && groups.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-text-muted">
            <CalendarBlank size={28} />
            <span className="text-sm">Ближайших событий этого типа не найдено</span>
          </div>
        )}

        <div className="relative flex flex-col gap-6 pb-4">
          {groups.length > 0 && <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border-subtle" />}
          {groups.map(([date, dayEvents], gi) => (
            <div key={date} className="relative pl-7">
              <div
                className={`absolute left-0 top-0.5 h-3.5 w-3.5 rounded-full border-2 ${
                  gi === 0 ? 'border-accent bg-accent/20' : 'border-border-color bg-bg-base'
                }`}
              />
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-primary">{dayLabel(date)}</span>
                <span className="font-tabular text-[10px] text-text-muted">{daysUntilLabel(date)}</span>
              </div>
              <div className="overflow-hidden border border-border-color bg-bg-panel">
                {dayEvents.map((e, i) => {
                  const meta = TYPE_META[e.type]
                  return (
                    <button
                      key={`${e.ticker}-${e.type}-${i}`}
                      onClick={() => {
                        selectTicker(e.ticker)
                        setView('terminal')
                      }}
                      className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-bg-hover ${
                        i > 0 ? 'border-t border-border-subtle' : ''
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
                      <InstrumentLogo ticker={e.ticker} isin={e.isin} size={26} isOfz={e.isOfz} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-text-primary">{e.name}</div>
                        <div className="font-tabular text-[11px] text-text-muted">{e.ticker}</div>
                      </div>
                      <span className={`shrink-0 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${meta.chip}`}>
                        {meta.label}
                      </span>
                      <div className="w-24 shrink-0 text-right">
                        {e.value != null && (
                          <div className="font-tabular text-xs font-semibold text-text-secondary">
                            {formatMoney(e.value, e.currency)}
                          </div>
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
    </div>
  )
}
