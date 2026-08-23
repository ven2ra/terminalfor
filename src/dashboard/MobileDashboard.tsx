import { useEffect, useState } from 'react'
import { useDashboardStore } from '@/store/useDashboardStore'
import { WIDGET_REGISTRY, WidgetType } from '@/dashboard/widgets'
import { AddWidgetMenu } from '@/dashboard/AddWidgetMenu'

/**
 * Мобильная раскладка терминала: вместо сжатой сетки виджетов — одна
 * полноэкранная панель за раз с переключением по нижней навигации,
 * как в мобильных приложениях брокеров, а не уменьшенная десктоп-сетка.
 */
export function MobileDashboard() {
  const { widgets, removeWidget } = useDashboardStore()
  const [activeTab, setActiveTab] = useState<WidgetType>(widgets.includes('chart') ? 'chart' : widgets[0])

  useEffect(() => {
    if (!widgets.includes(activeTab)) setActiveTab(widgets.includes('chart') ? 'chart' : widgets[0])
  }, [widgets, activeTab])

  const active = widgets.includes(activeTab) ? activeTab : widgets[0]

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-end border-b border-border-subtle bg-bg-base px-3 py-1.5">
        <AddWidgetMenu />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-bg-base">
        {active && (
          <div className="h-full overflow-hidden rounded-none border-0">
            {WIDGET_REGISTRY[active].render({ onRemove: () => removeWidget(active) })}
          </div>
        )}
        {!active && (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-text-muted">
            Все виджеты скрыты — добавьте хотя бы один через «Добавить виджет»
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-0.5 overflow-x-auto border-t border-border-subtle bg-bg-panel px-1 py-1">
        {widgets.map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`flex min-w-[64px] flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors ${
              active === type ? 'bg-bg-hover text-accent' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {WIDGET_REGISTRY[type].icon}
            <span className="truncate">{WIDGET_REGISTRY[type].label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
