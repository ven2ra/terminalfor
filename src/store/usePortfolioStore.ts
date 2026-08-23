import { create } from 'zustand'
import { AccountSummary, Position } from '@/types'
import { INITIAL_ACCOUNT, INITIAL_POSITIONS } from '@/mock/portfolio'

interface PortfolioState {
  account: AccountSummary
  positions: Position[]
  revalue: (prices: Record<string, number>) => void
}

/** Портфель пользователя: позиции, нереализованный P&L, сводка по счёту */
export const usePortfolioStore = create<PortfolioState>((set) => ({
  account: INITIAL_ACCOUNT,
  positions: INITIAL_POSITIONS,

  revalue: (prices) =>
    set((state) => {
      const positions = state.positions.map((pos) => {
        const currentPrice = prices[pos.ticker] ?? pos.currentPrice
        const direction = pos.side === 'buy' ? 1 : -1
        const pnl = (currentPrice - pos.avgPrice) * pos.size * direction
        const pnlPercent = ((currentPrice - pos.avgPrice) / pos.avgPrice) * 100 * direction
        return { ...pos, currentPrice, pnl, pnlPercent }
      })
      const todayPnl = positions.reduce((sum, p) => sum + p.pnl, 0)
      return {
        positions,
        account: {
          ...state.account,
          todayPnl,
          todayPnlPercent: (todayPnl / state.account.balance) * 100,
          equity: state.account.balance + todayPnl,
        },
      }
    }),
}))
