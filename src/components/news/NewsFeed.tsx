import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { AlertCircle } from 'lucide-react'
import { NewsItem } from '@/types'
import { INITIAL_NEWS, generateRandomNews } from '@/mock/news'
import { Panel } from '@/components/common/Panel'

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

/** Лента новостей и рыночных событий с периодическим пополнением */
export function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS)

  useEffect(() => {
    const interval = setInterval(() => {
      setNews((prev) => [generateRandomNews(), ...prev].slice(0, 30))
    }, 25000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Panel title="Новости и события" noPadding>
      <div className="flex flex-col divide-y divide-border-subtle">
        {news.map((n) => (
          <div key={n.id} className="px-3 py-2.5 hover:bg-bg-hover">
            <div className="mb-1 flex items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TAG_COLORS[n.tag]}`}>
                {TAG_LABELS[n.tag]}
              </span>
              {n.important && <AlertCircle size={12} className="text-sell" />}
              <span className="ml-auto text-[10px] text-text-muted">
                {formatDistanceToNow(n.time, { addSuffix: true, locale: ru })}
              </span>
            </div>
            <p className="text-xs leading-snug text-text-primary">{n.title}</p>
            <span className="text-[10px] text-text-muted">{n.source}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
