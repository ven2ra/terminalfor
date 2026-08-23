import { ResizableSplit } from '@/components/common/ResizableSplit'
import { Watchlist } from '@/components/watchlist/Watchlist'
import { ChartArea } from '@/components/chart/ChartArea'

/** Раздел «Графики»: инструмент слева, крупный график на всю рабочую область */
export function ChartsView() {
  return (
    <ResizableSplit direction="horizontal" initial={17} min={12} max={30}>
      <Watchlist />
      <ChartArea />
    </ResizableSplit>
  )
}
