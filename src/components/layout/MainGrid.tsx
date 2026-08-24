import { useViewStore } from '@/store/useViewStore'
import { Dashboard } from '@/dashboard/Dashboard'
import { ChartsView } from '@/components/views/ChartsView'
import { AnalyticsView } from '@/components/views/AnalyticsView'
import { ReportsView } from '@/components/views/ReportsView'
import { CalendarView } from '@/components/views/CalendarView'
import { ScalperView } from '@/components/views/ScalperView'

/**
 * Основная рабочая область. Раздел «Терминал» — свободно компонуемый dashboard
 * из виджетов (перетаскивание, ресайз, добавление/удаление). Остальные разделы
 * навигации — самостоятельные экраны: графики, аналитика по рынку, отчёты.
 */
export function MainGrid() {
  const { view } = useViewStore()

  return (
    <div className="min-h-0 flex-1">
      {view === 'terminal' && <Dashboard />}
      {view === 'charts' && <ChartsView />}
      {view === 'analytics' && <AnalyticsView />}
      {view === 'reports' && <ReportsView />}
      {view === 'calendar' && <CalendarView />}
      {view === 'scalper' && <ScalperView />}
    </div>
  )
}
