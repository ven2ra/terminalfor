import { useEffect } from 'react'
import { useMarketStore } from '@/store/useMarketStore'
import { usePortfolioStore } from '@/store/usePortfolioStore'

/**
 * Имитирует поток биржевых данных: периодически обновляет котировки,
 * стакан, ленту сделок и переоценивает открытые позиции портфеля.
 */
export function useMockFeed() {
  const { tickPrices, pushTrade, instruments } = useMarketStore()
  const { revalue } = usePortfolioStore()

  useEffect(() => {
    const priceInterval = setInterval(tickPrices, 1500)
    const tradeInterval = setInterval(pushTrade, 900)
    return () => {
      clearInterval(priceInterval)
      clearInterval(tradeInterval)
    }
  }, [tickPrices, pushTrade])

  useEffect(() => {
    const prices = Object.fromEntries(instruments.map((i) => [i.ticker, i.lastPrice]))
    revalue(prices)
  }, [instruments, revalue])
}
