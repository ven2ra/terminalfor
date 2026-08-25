import { AccountSummary } from '@/types'

/**
 * Значения для первой отрисовки до того, как usePortfolioStore.loadAccount()
 * подтянет реальные данные с бэкенда (server/db.js, SQLite) — и запасной
 * вариант, если бэкенд временно недоступен. Источник истины — база, не этот файл.
 */
export const INITIAL_ACCOUNT: AccountSummary = {
  balance: 1_248_930.5,
  equity: 1_262_410.2,
  availableMargin: 890_150.0,
  usedMargin: 358_780.5,
  todayPnl: 13_479.7,
  todayPnlPercent: 1.08,
}
