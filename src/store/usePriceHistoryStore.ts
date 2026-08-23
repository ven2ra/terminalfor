import { create } from 'zustand'

const MAX_SAMPLES = 30

interface PriceHistoryState {
  history: Record<string, number[]>
  record: (ticker: string, price: number) => void
}

/**
 * Короткая скользящая история цены по тикеру — только для мини-графиков
 * (спарклайны) в списке избранного. Не персистится, живёт в рамках сессии.
 */
export const usePriceHistoryStore = create<PriceHistoryState>((set, get) => ({
  history: {},

  record: (ticker, price) => {
    const prev = get().history[ticker] ?? []
    if (prev[prev.length - 1] === price) return
    const next = [...prev, price].slice(-MAX_SAMPLES)
    set((state) => ({ history: { ...state.history, [ticker]: next } }))
  },
}))
