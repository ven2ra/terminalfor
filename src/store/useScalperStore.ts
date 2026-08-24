import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ScalperState {
  tickers: string[]
  addTicker: (ticker: string) => void
  removeTicker: (ticker: string) => void
}

const DEFAULT_TICKERS = ['SBER', 'GAZP', 'LKOH']

/** Набор колонок скальперского шаблона (тикер на колонку) — сохраняется между сессиями */
export const useScalperStore = create<ScalperState>()(
  persist(
    (set, get) => ({
      tickers: DEFAULT_TICKERS,
      addTicker: (ticker) => {
        if (get().tickers.includes(ticker)) return
        set((state) => ({ tickers: [...state.tickers, ticker] }))
      },
      removeTicker: (ticker) => set((state) => ({ tickers: state.tickers.filter((t) => t !== ticker) })),
    }),
    { name: 'terminalfor-scalper' }
  )
)
