import { create } from 'zustand'
import { AccountSummary, Position, PositionSeed } from '@/types'
import { fetchAccount, fetchPositionSeeds } from '@/api/client'
import { INITIAL_ACCOUNT } from '@/mock/portfolio'

interface PortfolioState {
  account: AccountSummary
  positions: Position[]
  positionSeeds: PositionSeed[]
  initialized: boolean
  /** Грузит демо-счёт и стартовые позиции из SQLite на бэкенде (server/db.js) — вызывается один раз при старте приложения */
  loadAccount: () => Promise<void>
  revalue: (prices: Record<string, number>) => void
}

/** Портфель пользователя: позиции, нереализованный P&L, сводка по счёту */
export const usePortfolioStore = create<PortfolioState>((set) => ({
  // INITIAL_ACCOUNT — значения по умолчанию для первой отрисовки, пока
  // loadAccount() не подтянул реальные данные из БД (или если бэкенд недоступен)
  account: INITIAL_ACCOUNT,
  positions: [],
  positionSeeds: [],
  initialized: false,

  loadAccount: async () => {
    try {
      const [account, positionSeeds] = await Promise.all([fetchAccount(), fetchPositionSeeds()])
      set({ account, positionSeeds })
    } catch {
      // бэкенд недоступен — остаёмся на INITIAL_ACCOUNT/пустых сидах, тихо
    }
  },

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
        : state.positionSeeds
            .filter((seed) => prices[seed.ticker] != null)
            .map((seed) => {
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
