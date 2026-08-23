import { useEffect } from 'react'
import { useMarketStore } from '@/store/useMarketStore'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { useEquityHistoryStore } from '@/store/useEquityHistoryStore'

const SECURITIES_POLL_MS = 1500
const EXTRA_SECURITIES_POLL_MS = 20000 // облигации/фьючерсы обновляются реже — список тяжёлый для ISS
const BOOK_AND_TRADES_POLL_MS = 1500

/**
 * Опрашивает бэкенд (который в свою очередь кэширует MOEX ISS) за живыми
 * котировками всего рынка, стаканом и лентой сделок по выбранной бумаге,
 * а также переоценивает портфель по актуальным ценам.
 */
export function useMarketFeed() {
  const { loadSecurities, loadExtraSecurities, refreshOrderBook, loadTrades, instruments } = useMarketStore()
  const { revalue, account } = usePortfolioStore()
  const recordEquity = useEquityHistoryStore((s) => s.record)

  useEffect(() => {
    loadSecurities()
    const interval = setInterval(loadSecurities, SECURITIES_POLL_MS)
    return () => clearInterval(interval)
  }, [loadSecurities])

  useEffect(() => {
    // Не блокирует первую отрисовку основного списка акций — подтягивается следом
    loadExtraSecurities()
    const interval = setInterval(loadExtraSecurities, EXTRA_SECURITIES_POLL_MS)
    return () => clearInterval(interval)
  }, [loadExtraSecurities])

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

  useEffect(() => {
    if (!account.equity) return
    recordEquity(account.equity)
  }, [account.equity, recordEquity])
}
