import { OrderBookLevel } from '@/types'
import { formatCompact } from '@/lib/format'

interface OrderBookDepthChartProps {
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
}

const WIDTH = 200
const HEIGHT = 56

/**
 * Визуализация глубины рынка: кумулятивный объём покупки/продажи, минимальный
 * у текущей цены (в центре) и нарастающий по мере удаления от неё в обе стороны.
 */
export function OrderBookDepthChart({ bids, asks }: OrderBookDepthChartProps) {
  if (bids.length === 0 || asks.length === 0) {
    return <div className="h-14" />
  }

  const maxTotal = Math.max(bids[bids.length - 1].total, asks[asks.length - 1].total, 1)
  const half = WIDTH / 2
  const toY = (total: number) => HEIGHT - (total / maxTotal) * HEIGHT

  // Слева направо: от самой дальней заявки на покупку к лучшей (центр — текущая цена)
  const bidPoints = [...bids]
    .reverse()
    .map((level, i, arr) => `${(i / Math.max(arr.length - 1, 1)) * half},${toY(level.total)}`)
  // Справа от центра: от лучшей заявки на продажу к самой дальней
  const askPoints = asks.map((level, i, arr) => `${half + (i / Math.max(arr.length - 1, 1)) * half},${toY(level.total)}`)

  const bidArea = `0,${HEIGHT} ${bidPoints.join(' ')} ${half},${HEIGHT}`
  const askArea = `${half},${HEIGHT} ${askPoints.join(' ')} ${WIDTH},${HEIGHT}`

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="h-14 w-full">
        <polygon points={bidArea} fill="var(--buy)" fillOpacity="0.22" />
        <polyline points={bidPoints.join(' ')} fill="none" stroke="var(--buy)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <polygon points={askArea} fill="var(--sell)" fillOpacity="0.22" />
        <polyline points={askPoints.join(' ')} fill="none" stroke="var(--sell)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <line x1={half} y1="0" x2={half} y2={HEIGHT} stroke="var(--border-color)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between px-1 text-[10px] font-tabular text-text-muted">
        <span>{formatCompact(bids[bids.length - 1].total)}</span>
        <span>{formatCompact(asks[asks.length - 1].total)}</span>
      </div>
    </div>
  )
}
