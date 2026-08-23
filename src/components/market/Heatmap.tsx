import { useMemo } from 'react'
import { Grid3x3 } from 'lucide-react'
import { useMarketStore } from '@/store/useMarketStore'
import { Panel } from '@/components/common/Panel'
import { formatPercent } from '@/lib/format'

interface HeatmapProps {
  onRemove?: () => void
}

const TILE_COUNT = 24

/** Компактная тепловая карта рынка: топ бумаг по обороту, размер и цвет плитки — от объёма и дневного % */
export function Heatmap({ onRemove }: HeatmapProps) {
  const { instruments, selectTicker } = useMarketStore()

  const tiles = useMemo(() => {
    return [...instruments]
      .filter((i) => i.assetType === 'share' || i.assetType === 'fund')
      .sort((a, b) => b.turnover - a.turnover)
      .slice(0, TILE_COUNT)
  }, [instruments])

  const maxTurnover = Math.max(...tiles.map((t) => t.turnover), 1)

  // Интенсивность заливки растёт с силой движения (условная шкала до 4%)
  const intensity = (pct: number) => Math.min(1, Math.abs(pct) / 4)

  return (
    <Panel title="Тепловая карта" icon={<Grid3x3 size={14} />} noPadding draggable={!!onRemove} onRemove={onRemove}>
      <div className="grid h-full auto-rows-fr grid-cols-4 gap-1 overflow-auto p-2 sm:grid-cols-6">
        {tiles.map((t) => {
          const positive = t.changePercent >= 0
          const alpha = 0.15 + intensity(t.changePercent) * 0.55
          const scale = 0.85 + (t.turnover / maxTurnover) * 0.15
          return (
            <button
              key={t.ticker}
              onClick={() => selectTicker(t.ticker)}
              title={`${t.name} · ${formatPercent(t.changePercent)}`}
              style={{
                backgroundColor: positive ? `rgba(16,185,129,${alpha})` : `rgba(248,113,113,${alpha})`,
                transform: `scale(${scale})`,
              }}
              className="flex flex-col items-center justify-center rounded-md px-1 py-2 text-center transition-transform hover:z-10 hover:scale-105"
            >
              <span className="text-[11px] font-bold text-text-primary">{t.ticker}</span>
              <span className={`font-tabular text-[10px] font-semibold ${positive ? 'text-buy' : 'text-sell'}`}>
                {formatPercent(t.changePercent)}
              </span>
            </button>
          )
        })}
        {tiles.length === 0 && (
          <div className="col-span-full flex items-center justify-center text-xs text-text-muted">Загрузка данных…</div>
        )}
      </div>
    </Panel>
  )
}
