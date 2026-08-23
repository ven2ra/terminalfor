import { useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ArrowSquareOut, Fire } from '@phosphor-icons/react'
import { NewsItem } from '@/types'
import { fetchNews } from '@/api/client'
import { Panel } from '@/components/common/Panel'
import { SkeletonRows } from '@/components/common/Skeleton'

const TAG_LABELS: Record<NewsItem['tag'], string> = {
  market: 'Рынок',
  company: 'Компании',
  politics: 'Политика',
  society: 'Общество',
}

const TAG_COLORS: Record<NewsItem['tag'], string> = {
  market: 'text-accent bg-accent/10',
  company: 'text-buy bg-buy-bg',
  politics: 'text-sell bg-sell-bg',
  society: 'text-text-secondary bg-bg-elevated',
}

const FILTERS: Array<{ value: NewsItem['tag'] | 'all' | 'important'; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'important', label: 'Важное' },
  { value: 'market', label: 'Рынок' },
  { value: 'company', label: 'Компании' },
  { value: 'politics', label: 'Политика' },
  { value: 'society', label: 'Общество' },
]

const POLL_MS = 60000

interface NewsFeedProps {
  onRemove?: () => void
}

/** Лента новостей — РБК, Финам, РИА/Lenta (политика) и Telegram-канал MarketTwits */
export function NewsFeed({ onRemove }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<NewsItem['tag'] | 'all' | 'important'>('all')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await fetchNews()
        if (!cancelled) setNews(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return news
    if (filter === 'important') return news.filter((n) => n.important)
    return news.filter((n) => n.tag === filter)
  }, [news, filter])

  return (
    <Panel title="Новости и события" noPadding draggable={!!onRemove} onRemove={onRemove}>
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 flex-wrap gap-1 border-b border-border-subtle px-2 py-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded px-2 py-1 text-[11px] font-medium transition-all active:scale-95 ${
                filter === f.value ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {loading && news.length === 0 ? (
            <div className="p-3">
              <SkeletonRows rows={8} />
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border-subtle">
              {filtered.map((n) => (
                <a
                  key={n.id}
                  href={n.link}
                  target="_blank"
                  rel="noreferrer"
                  className={`group block px-3 py-2.5 hover:bg-bg-hover ${
                    n.important ? 'border-l-2 border-warning bg-warning-bg/40' : ''
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    {n.important && (
                      <span className="flex items-center gap-0.5 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-warning">
                        <Fire size={10} /> Важное
                      </span>
                    )}
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TAG_COLORS[n.tag]}`}>
                      {TAG_LABELS[n.tag]}
                    </span>
                    <span className="ml-auto text-[10px] text-text-muted">
                      {formatDistanceToNow(n.time, { addSuffix: true, locale: ru })}
                    </span>
                  </div>
                  <p className={`flex items-start gap-1 text-xs leading-snug ${n.important ? 'font-semibold text-text-primary' : 'text-text-primary'}`}>
                    <span>{n.title}</span>
                    <ArrowSquareOut size={10} className="mt-0.5 shrink-0 text-text-muted opacity-0 group-hover:opacity-100" />
                  </p>
                  <span className="text-[10px] text-text-muted">{n.source}</span>
                </a>
              ))}
              {filtered.length === 0 && (
                <div className="p-4 text-center text-xs text-text-muted">
                  {filter === 'important' ? 'Важных новостей за последнее время нет' : 'Новостей пока нет'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}
