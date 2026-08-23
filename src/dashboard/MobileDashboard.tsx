import { useEffect, useState } from 'react'
import { Star } from '@phosphor-icons/react'
import { useDashboardStore } from '@/store/useDashboardStore'
import { WIDGET_REGISTRY, WidgetType } from '@/dashboard/widgets'
import { AddWidgetMenu } from '@/dashboard/AddWidgetMenu'
import { Watchlist } from '@/components/watchlist/Watchlist'

type MobileTab = WidgetType | 'watchlist'

/**
 * Мобильная раскладка терминала: вместо сжатой сетки виджетов — одна
 * полноэкранная панель за раз с переключением по нижней навигации,
 * как в мобильных приложениях брокеров, а не уменьшенная десктоп-сетка.
 * "Инструменты" — постоянная первая вкладка вне системы виджетов (как
 * список инструментов на десктопе — часть каркаса, а не настраиваемый блок).
 */
export function MobileDashboard() {
  const { widgets: storedWidgets, removeWidget } = useDashboardStore()
  const widgets = storedWidgets.filter((w): w is WidgetType => w in WIDGET_REGISTRY)
  const [activeTab, setActiveTab] = useState<MobileTab>('watchlist')

  useEffect(() => {
    if (activeTab !== 'watchlist' && !widgets.includes(activeTab)) setActiveTab('watchlist')
  }, [widgets, activeTab])

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-end border-b border-border-subtle bg-bg-base px-3 py-1.5">
        <AddWidgetMenu />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-bg-base">
        {activeTab === 'watchlist' ? (
          <Watchlist />
        ) : (
          <div className="h-full overflow-hidden rounded-none border-0">
            {WIDGET_REGISTRY[activeTab].render({ onRemove: () => removeWidget(activeTab) })}
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-0.5 overflow-x-auto border-t border-border-subtle bg-bg-panel px-1 py-1">
        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex min-w-[64px] flex-1 flex-col items-center gap-0.5 px-2 py-1.5 text-[11px] font-medium transition-colors ${
            activeTab === 'watchlist' ? 'bg-bg-hover text-accent' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Star size={14} />
          <span className="truncate">Инструменты</span>
        </button>
        {widgets.map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`flex min-w-[64px] flex-1 flex-col items-center gap-0.5 px-2 py-1.5 text-[11px] font-medium transition-colors ${
              activeTab === type ? 'bg-bg-hover text-accent' : 'text-text-muted hover:text-text-secondary'
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
