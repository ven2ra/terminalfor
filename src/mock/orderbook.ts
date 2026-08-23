import { OrderBookData, OrderBookLevel } from '@/types'

/**
 * MOEX ISS в бесплatном доступе отдаёт только лучшие bid/offer (без глубины L2).
 * Стакан вокруг них достраивается синтетически — реалистичная лесенка объёмов,
 * но сама верхняя цена (спред) всегда настоящая, с биржи.
 */
export function synthesizeOrderBook(bid: number, offer: number, depth = 12): OrderBookData {
  const tick = Math.max(offer - bid, bid * 0.0005, 0.01)
  const bids: OrderBookLevel[] = []
  const asks: OrderBookLevel[] = []
  let bidTotal = 0
  let askTotal = 0

  for (let i = 0; i < depth; i++) {
    const bidPrice = +(bid - tick * i * (1 + Math.random() * 0.4)).toFixed(2)
    const askPrice = +(offer + tick * i * (1 + Math.random() * 0.4)).toFixed(2)
    const bidSize = Math.round(30 + Math.random() * 900 * (1 - i / depth))
    const askSize = Math.round(30 + Math.random() * 900 * (1 - i / depth))
    bidTotal += bidSize
    askTotal += askSize
    bids.push({ price: bidPrice, size: bidSize, total: bidTotal })
    asks.push({ price: askPrice, size: askSize, total: askTotal })
  }

  return { bids, asks }
}
