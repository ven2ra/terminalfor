import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Layout, LayoutItem } from 'react-grid-layout'
import { DEFAULT_WIDGETS, WIDGET_REGISTRY, WidgetType } from '@/dashboard/widgets'

function buildDefaultLayout(): LayoutItem[] {
  return DEFAULT_WIDGETS.map((type) => ({ i: type, ...WIDGET_REGISTRY[type].layout }))
}

interface DashboardState {
  widgets: WidgetType[]
  layout: LayoutItem[]
  addWidget: (type: WidgetType) => void
  removeWidget: (type: WidgetType) => void
  setLayout: (layout: Layout) => void
  resetLayout: () => void
}

/** Раскладка рабочей области: какие виджеты добавлены и как они расположены (persisted) */
export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgets: DEFAULT_WIDGETS,
      layout: buildDefaultLayout(),

      addWidget: (type) => {
        if (get().widgets.includes(type)) return
        const def = WIDGET_REGISTRY[type]
        set((state) => ({
          widgets: [...state.widgets, type],
          layout: [...state.layout, { i: type, ...def.layout, x: 0, y: Infinity }],
        }))
      },

      removeWidget: (type) => {
        set((state) => ({
          widgets: state.widgets.filter((w) => w !== type),
          layout: state.layout.filter((l) => l.i !== type),
        }))
      },

      setLayout: (layout) => set({ layout: [...layout] }),

      resetLayout: () => set({ widgets: DEFAULT_WIDGETS, layout: buildDefaultLayout() }),
    }),
    { name: 'terminalfor-dashboard-v2' }
  )
)
