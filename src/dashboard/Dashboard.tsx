import type { Ref } from 'react'
import { GridLayout, useContainerWidth } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import { useDashboardStore } from '@/store/useDashboardStore'
import { GRID_COLS, WIDGET_REGISTRY, WidgetType } from '@/dashboard/widgets'
import { AddWidgetMenu } from '@/dashboard/AddWidgetMenu'
import { MobileDashboard } from '@/dashboard/MobileDashboard'
import { Watchlist } from '@/components/watchlist/Watchlist'
import { useIsMobile } from '@/hooks/useIsMobile'

const ROW_HEIGHT = 26
const MARGIN: readonly [number, number] = [8, 8]

/**
 * Список инструментов — часть постоянного каркаса терминала (аналогично
 * боковому icon-rail), а не перетаскиваемый виджет: на бирже он нужен
 * всегда под рукой, независимо от того, как пользователь настроил сетку.
 */
export function Dashboard() {
  const { widgets: storedWidgets, layout, setLayout, removeWidget } = useDashboardStore()
  const { width, containerRef } = useContainerWidth({ initialWidth: 1400 })
  const isMobile = useIsMobile()

  // Защита от значений "watchlist", оставшихся в localStorage со времён,
  // когда список инструментов ещё был обычным виджетом сетки
  const widgets = storedWidgets.filter((w): w is WidgetType => w in WIDGET_REGISTRY)

  if (isMobile) return <MobileDashboard />

  return (
    <div className="flex h-full">
      <div className="w-64 shrink-0 border-r border-border-color">
        <Watchlist />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center justify-end border-b border-border-subtle bg-bg-base px-3 py-1.5">
          <AddWidgetMenu />
        </div>
        <div ref={containerRef as Ref<HTMLDivElement>} className="min-h-0 flex-1 overflow-auto bg-bg-base">
          <GridLayout
            width={width}
            layout={layout}
            gridConfig={{ cols: GRID_COLS, rowHeight: ROW_HEIGHT, margin: MARGIN, containerPadding: MARGIN, maxRows: Infinity }}
            dragConfig={{ handle: '.widget-drag-handle' }}
            resizeConfig={{ handles: ['se'] }}
            autoSize
            onLayoutChange={setLayout}
          >
            {widgets.map((type, i) => (
              <div
                key={type}
                className="animate-widget-in overflow-hidden border border-border-color shadow-panel"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                {WIDGET_REGISTRY[type].render({ onRemove: () => removeWidget(type) })}
              </div>
            ))}
          </GridLayout>
        </div>
      </div>
    </div>
  )
}
