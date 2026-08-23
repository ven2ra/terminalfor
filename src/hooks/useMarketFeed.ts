import { useEffect } from 'react'
import { useMarketStore } from '@/store/useMarketStore'
import { usePortfolioStore } from '@/store/usePortfolioStore'

const SECURITIES_POLL_MS = 4000
const BOOK_AND_TRADES_POLL_MS = 2500

/**
 * Опрашивает бэкенд (который в свою очередь кэширует MOEX ISS) за живыми
 * котировками всего рынка, стаканом и лентой сделок по выбранной бумаге,
 * а также переоценивает портфель по актуальным ценам.
 */
export function useMarketFeed() {
  const { loadSecurities, refreshOrderBook, loadTrades, instruments } = useMarketStore()
  const { revalue } = usePortfolioStore()

  useEffect(() => {
    loadSecurities()
    const interval = setInterval(loadSecurities, SECURITIES_POLL_MS)
    return () => clearInterval(interval)
  }, [loadSecurities])

  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrderBook()
      loadTrades()
    }, BOOK_AND_TRADES_POLL_MS)
    return () => clearInterval(interval)
  }, [refreshOrderBook, loadTrades])

  useEffect(() => {
    if (instruments.length === 0) return
    const prices = Object.fromEntries(instruments.map((i) => [i.ticker, i.lastPrice]))
    revalue(prices)
  }, [instruments, revalue])
}
