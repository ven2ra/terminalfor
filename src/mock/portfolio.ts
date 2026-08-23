import { AccountSummary, Position } from '@/types'

export const INITIAL_ACCOUNT: AccountSummary = {
  balance: 1_248_930.5,
  equity: 1_262_410.2,
  availableMargin: 890_150.0,
  usedMargin: 358_780.5,
  todayPnl: 13_479.7,
  todayPnlPercent: 1.08,
}

export const INITIAL_POSITIONS: Position[] = [
  { ticker: 'SBER', side: 'buy', size: 1200, avgPrice: 281.2, currentPrice: 289.45, pnl: 9900, pnlPercent: 2.93 },
  { ticker: 'LKOH', side: 'buy', size: 20, avgPrice: 7050.0, currentPrice: 7218.5, pnl: 3370, pnlPercent: 2.39 },
  { ticker: 'GAZP', side: 'sell', size: 800, avgPrice: 141.5, currentPrice: 138.02, pnl: 2784, pnlPercent: 2.46 },
  { ticker: 'BTCUSDT', side: 'buy', size: 0.15, avgPrice: 66200.0, currentPrice: 68420.15, pnl: 333.02, pnlPercent: 3.35 },
]
