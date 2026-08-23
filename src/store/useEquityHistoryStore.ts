import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface EquityPoint {
  time: number // unix ms
  equity: number
}

const SNAPSHOT_INTERVAL_MS = 30000 // не чаще раза в 30с — иначе локальное хранилище раздувается
const MAX_POINTS = 5000 // ~41 часа при интервале 30с — с запасом на любой демо-период

interface EquityHistoryState {
  points: EquityPoint[]
  record: (equity: number) => void
}

/** История стоимости портфеля (equity) для графика доходности в «Отчётах» — накапливается по ходу сессии */
export const useEquityHistoryStore = create<EquityHistoryState>()(
  persist(
    (set, get) => ({
      points: [],

      record: (equity) => {
        const now = Date.now()
        const existing = get().points
        const last = existing[existing.length - 1]
        if (last && now - last.time < SNAPSHOT_INTERVAL_MS) return
        const points = [...get().points, { time: now, equity }].slice(-MAX_POINTS)
        set({ points })
      },
    }),
    { name: 'terminalfor-equity-history-v1' }
  )
)
