import type { Ref } from 'react'
import { GridLayout, useContainerWidth } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import { useDashboardStore } from '@/store/useDashboardStore'
import { WIDGET_REGISTRY } from '@/dashboard/widgets'
import { AddWidgetMenu } from '@/dashboard/AddWidgetMenu'
import { MobileDashboard } from '@/dashboard/MobileDashboard'
import { useIsMobile } from '@/hooks/useIsMobile'

const ROW_HEIGHT = 26
const MARGIN: readonly [number, number] = [8, 8]

/**
 * Свободно компонуемая рабочая область: виджеты можно перетаскивать за
 * заголовок, менять их размер за нижний правый угол и удалять — раскладка
 * сохраняется в localStorage между сессиями. На узких экранах вместо
 * сжатой сетки — полноэкранные вкладки (MobileDashboard).
 */
export function Dashboard() {
  const { widgets, layout, setLayout, removeWidget } = useDashboardStore()
  const { width, containerRef } = useContainerWidth({ initialWidth: 1400 })
  const isMobile = useIsMobile()

  if (isMobile) return <MobileDashboard />

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-end border-b border-border-subtle bg-bg-base px-3 py-1.5">
        <AddWidgetMenu />
      </div>
      <div ref={containerRef as Ref<HTMLDivElement>} className="min-h-0 flex-1 overflow-auto bg-bg-base">
        <GridLayout
          width={width}
          layout={layout}
          gridConfig={{ cols: 12, rowHeight: ROW_HEIGHT, margin: MARGIN, containerPadding: MARGIN, maxRows: Infinity }}
          dragConfig={{ handle: '.widget-drag-handle' }}
          resizeConfig={{ handles: ['se'] }}
          autoSize
          onLayoutChange={setLayout}
        >
          {widgets.map((type) => (
            <div key={type} className="overflow-hidden rounded-lg border border-border-color shadow-panel">
              {WIDGET_REGISTRY[type].render({ onRemove: () => removeWidget(type) })}
            </div>
          ))}
        </GridLayout>
      </div>
    </div>
  )
}
