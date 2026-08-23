import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AlertCondition = 'above' | 'below'

export interface PriceAlert {
  id: string
  ticker: string
  condition: AlertCondition
  targetPrice: number
  createdAt: number
  triggeredAt: number | null
  /** Отметка "прочитано" в колокольчике — не влияет на срабатывание, только на счётчик уведомлений */
  seen: boolean
}

interface AlertsState {
  alerts: PriceAlert[]
  addAlert: (ticker: string, condition: AlertCondition, targetPrice: number) => void
  removeAlert: (id: string) => void
  markTriggered: (id: string, at: number) => void
  markAllSeen: () => void
}

/** Ценовые алерты: срабатывание отслеживается в useAlertsWatcher по живым котировкам (persisted) */
export const useAlertsStore = create<AlertsState>()(
  persist(
    (set) => ({
      alerts: [],

      addAlert: (ticker, condition, targetPrice) => {
        const alert: PriceAlert = {
          id: `${ticker}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          ticker,
          condition,
          targetPrice,
          createdAt: Date.now(),
          triggeredAt: null,
          seen: true,
        }
        set((state) => ({ alerts: [alert, ...state.alerts] }))
      },

      removeAlert: (id) => {
        set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) }))
      },

      markTriggered: (id, at) => {
        set((state) => ({
          alerts: state.alerts.map((a) => (a.id === id ? { ...a, triggeredAt: at, seen: false } : a)),
        }))
      },

      markAllSeen: () => {
        set((state) => ({ alerts: state.alerts.map((a) => ({ ...a, seen: true })) }))
      },
    }),
    { name: 'terminalfor-alerts-v1' }
  )
)
