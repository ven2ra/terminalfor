import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ExternalLink } from 'lucide-react'
import { NewsItem } from '@/types'
import { fetchNews } from '@/api/client'
import { Panel } from '@/components/common/Panel'
import { SkeletonRows } from '@/components/common/Skeleton'

const TAG_LABELS: Record<NewsItem['tag'], string> = {
  market: 'Рынок',
  company: 'Компании',
  macro: 'Макро',
  crypto: 'Крипто',
}

const TAG_COLORS: Record<NewsItem['tag'], string> = {
  market: 'text-accent bg-accent/10',
  company: 'text-buy bg-buy-bg',
  macro: 'text-text-secondary bg-bg-elevated',
  crypto: 'text-sell bg-sell-bg',
}

const POLL_MS = 60000

interface NewsFeedProps {
  onRemove?: () => void
}

/** Лента новостей — реальные заголовки РБК и Финам через бэкенд-прокси */
export function NewsFeed({ onRemove }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <Panel title="Новости и события" noPadding draggable={!!onRemove} onRemove={onRemove}>
      {loading && news.length === 0 ? (
        <div className="p-3">
          <SkeletonRows rows={8} />
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle">
          {news.map((n) => (
            <a
              key={n.id}
              href={n.link}
              target="_blank"
              rel="noreferrer"
              className="group block px-3 py-2.5 hover:bg-bg-hover"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TAG_COLORS[n.tag]}`}>
                  {TAG_LABELS[n.tag]}
                </span>
                <span className="ml-auto text-[10px] text-text-muted">
                  {formatDistanceToNow(n.time, { addSuffix: true, locale: ru })}
                </span>
              </div>
              <p className="flex items-start gap-1 text-xs leading-snug text-text-primary">
                <span>{n.title}</span>
                <ExternalLink size={10} className="mt-0.5 shrink-0 text-text-muted opacity-0 group-hover:opacity-100" />
              </p>
              <span className="text-[10px] text-text-muted">{n.source}</span>
            </a>
          ))}
          {news.length === 0 && <div className="p-4 text-center text-xs text-text-muted">Новостей пока нет</div>}
        </div>
      )}
    </Panel>
  )
}
