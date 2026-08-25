import { AccountSummary } from '@/types'

export const INITIAL_ACCOUNT: AccountSummary = {
  balance: 1_248_930.5,
  equity: 1_262_410.2,
  availableMargin: -300_000.0,
  usedMargin: 358_780.5,
  todayPnl: 13_479.7,
  todayPnlPercent: 1.08,
}

/**
 * Стартовые позиции портфеля — реальные тикеры МосБиржи. offsetPercent задаёт,
 * насколько цена входа отличается от текущей рыночной — сама avgPrice
 * вычисляется от первой живой котировки (см. usePortfolioStore), а не хардкодится,
 * чтобы портфель оставался реалистичным вне зависимости от того, где сейчас рынок.
 */
export const POSITION_SEEDS: Array<{ ticker: string; side: 'buy' | 'sell'; size: number; offsetPercent: number }> = [
  { ticker: 'SBER', side: 'buy', size: 1200, offsetPercent: -2.9 },
  { ticker: 'LKOH', side: 'buy', size: 20, offsetPercent: -2.4 },
  { ticker: 'GAZP', side: 'sell', size: 800, offsetPercent: 2.5 },
  { ticker: 'ROSN', side: 'buy', size: 150, offsetPercent: -4.6 },
]
