import { useMemo } from 'react'
import { Activity, TrendingDown, TrendingUp } from 'lucide-react'
import { useMarketStore } from '@/store/useMarketStore'
import { Panel } from '@/components/common/Panel'
import { formatCompact, formatPercent } from '@/lib/format'

interface MarketOverviewProps {
  onRemove?: () => void
}

/** Сводка по рынку целиком: широта рынка (advancers/decliners), суммарный оборот, лидеры дня */
export function MarketOverview({ onRemove }: MarketOverviewProps) {
  const { instruments } = useMarketStore()
  const shares = useMemo(() => instruments.filter((i) => i.assetType === 'share' || i.assetType === 'fund'), [instruments])

  const stats = useMemo(() => {
    const advancers = shares.filter((i) => i.changePercent > 0).length
    const decliners = shares.filter((i) => i.changePercent < 0).length
    const unchanged = shares.length - advancers - decliners
    const turnover = shares.reduce((sum, i) => sum + i.turnover, 0)
    const top = [...shares].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3)
    const bottom = [...shares].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3)
    return { advancers, decliners, unchanged, turnover, top, bottom }
  }, [shares])

  const total = stats.advancers + stats.decliners + stats.unchanged || 1
  const advancersShare = (stats.advancers / total) * 100

  return (
    <Panel title="Обзор рынка" icon={<Activity size={14} />} noPadding draggable={!!onRemove} onRemove={onRemove}>
      <div className="flex h-full flex-col gap-3 overflow-auto p-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-text-muted">
            <span>
              Растут <span className="font-tabular text-buy">{stats.advancers}</span>
            </span>
            <span>
              Падают <span className="font-tabular text-sell">{stats.decliners}</span>
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-sell">
            <div className="h-full bg-buy" style={{ width: `${advancersShare}%` }} />
          </div>
        </div>

        <div className="rounded-md bg-bg-elevated px-2.5 py-2 text-xs">
          <div className="text-text-muted">Суммарный оборот</div>
          <div className="font-tabular text-base font-bold text-text-primary">{formatCompact(stats.turnover)} ₽</div>
        </div>

        <div>
          <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-buy">
            <TrendingUp size={11} /> Лидеры роста
          </div>
          <div className="space-y-1">
            {stats.top.map((i) => (
              <div key={i.ticker} className="flex items-center justify-between text-xs">
                <span className="font-medium text-text-primary">{i.ticker}</span>
                <span className="font-tabular text-buy">{formatPercent(i.changePercent)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-sell">
            <TrendingDown size={11} /> Лидеры падения
          </div>
          <div className="space-y-1">
            {stats.bottom.map((i) => (
              <div key={i.ticker} className="flex items-center justify-between text-xs">
                <span className="font-medium text-text-primary">{i.ticker}</span>
                <span className="font-tabular text-sell">{formatPercent(i.changePercent)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}
