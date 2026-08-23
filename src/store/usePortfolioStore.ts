import { create } from 'zustand'
import { AccountSummary, Position } from '@/types'
import { INITIAL_ACCOUNT, POSITION_SEEDS } from '@/mock/portfolio'

interface PortfolioState {
  account: AccountSummary
  positions: Position[]
  initialized: boolean
  revalue: (prices: Record<string, number>) => void
}

/** Портфель пользователя: позиции, нереализованный P&L, сводка по счёту */
export const usePortfolioStore = create<PortfolioState>((set) => ({
  account: INITIAL_ACCOUNT,
  positions: [],
  initialized: false,

  revalue: (prices) =>
    set((state) => {
      // Первая живая котировка — точка отсчёта для цены входа демо-позиций
      const positions: Position[] = state.initialized
        ? state.positions.map((pos) => {
            const currentPrice = prices[pos.ticker] ?? pos.currentPrice
            const direction = pos.side === 'buy' ? 1 : -1
            const pnl = (currentPrice - pos.avgPrice) * pos.size * direction
            const pnlPercent = ((currentPrice - pos.avgPrice) / pos.avgPrice) * 100 * direction
            return { ...pos, currentPrice, pnl, pnlPercent }
          })
        : POSITION_SEEDS.filter((seed) => prices[seed.ticker] != null).map((seed) => {
            const currentPrice = prices[seed.ticker]
            const avgPrice = currentPrice * (1 - seed.offsetPercent / 100)
            const direction = seed.side === 'buy' ? 1 : -1
            const pnl = (currentPrice - avgPrice) * seed.size * direction
            const pnlPercent = ((currentPrice - avgPrice) / avgPrice) * 100 * direction
            return { ticker: seed.ticker, side: seed.side, size: seed.size, avgPrice, currentPrice, pnl, pnlPercent }
          })

      if (!state.initialized && positions.length === 0) return state

      const todayPnl = positions.reduce((sum, p) => sum + p.pnl, 0)
      return {
        positions,
        initialized: true,
        account: {
          ...state.account,
          todayPnl,
          todayPnlPercent: (todayPnl / state.account.balance) * 100,
          equity: state.account.balance + todayPnl,
        },
      }
    }),
}))
