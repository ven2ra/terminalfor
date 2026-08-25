import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

/**
 * Портфель пользователя: позиции, нереализованный P&L, сводка по счёту.
 * account/positionSeeds персистятся (localStorage) — иначе при каждой
 * перезагрузке страницы на долю секунды мелькали бы значения по умолчанию
 * из INITIAL_ACCOUNT (см. src/mock/portfolio.ts), пока не придёт ответ от
 * /api/account. Источник истины всё равно БД: loadAccount() при следующем
 * старте перезатирает персистентное значение свежим из SQLite.
 */
export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      // INITIAL_ACCOUNT — только пока ничего не персистилось (самый первый
      // визит) и до первого ответа loadAccount()
      account: INITIAL_ACCOUNT,
      positions: [],
      positionSeeds: [],
      initialized: false,

      loadAccount: async () => {
        try {
          const [account, positionSeeds] = await Promise.all([fetchAccount(), fetchPositionSeeds()])
          set({ account, positionSeeds })
        } catch {
          // бэкенд недоступен — остаёмся на персистентном/INITIAL_ACCOUNT значении, тихо
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
                  return {
                    ticker: seed.ticker,
                    side: seed.side,
                    size: seed.size,
                    avgPrice,
                    currentPrice,
                    pnl,
                    pnlPercent,
                  }
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
    }),
    {
      name: 'terminalfor-portfolio-v1',
      partialize: (state) => ({ account: state.account, positionSeeds: state.positionSeeds }),
    }
  )
)
