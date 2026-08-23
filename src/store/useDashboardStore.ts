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
  // Инкрементируется при сбросе раскладки и используется как React key для
  // <GridLayout> (Dashboard.tsx): react-grid-layout v2 хранит собственное
  // внутреннее layout-состояние и досинхронизирует его с новым props.layout
  // через diffing-эффект, а не всегда пересобирает с нуля — смена key
  // форсирует полный ремаунт, гарантируя чистый initial-mount синк вместо
  // непредсказуемого merge с уже испорченным внутренним состоянием
  layoutEpoch: number
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
      layoutEpoch: 0,

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

      resetLayout: () =>
        set((state) => ({
          widgets: DEFAULT_WIDGETS,
          layout: buildDefaultLayout(),
          layoutEpoch: state.layoutEpoch + 1,
        })),
    }),
    // v4: сетка сжата с 12 до 10 колонок и Watchlist убран из виджетов
    // (стал постоянной панелью) — координаты старых сохранённых раскладок
    // больше не совместимы, поэтому версия хранилища бампнута, чтобы у всех
    // пользователей раскладка пересобралась из новых дефолтов, а не наложилась
    { name: 'terminalfor-dashboard-v4' }
  )
)
