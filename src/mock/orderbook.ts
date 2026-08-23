import { OrderBookData, OrderBookLevel, Trade } from '@/types'

/** Строит стакан заявок вокруг текущей цены с убывающей ликвидностью по мере удаления */
export function generateOrderBook(midPrice: number, depth = 12, tickSize = 0.05): OrderBookData {
  const bids: OrderBookLevel[] = []
  const asks: OrderBookLevel[] = []
  let bidTotal = 0
  let askTotal = 0

  for (let i = 0; i < depth; i++) {
    const bidPrice = +(midPrice - tickSize * (i + 1) * (1 + Math.random() * 0.3)).toFixed(2)
    const askPrice = +(midPrice + tickSize * (i + 1) * (1 + Math.random() * 0.3)).toFixed(2)
    const bidSize = Math.round(50 + Math.random() * 950 * (1 - i / depth))
    const askSize = Math.round(50 + Math.random() * 950 * (1 - i / depth))
    bidTotal += bidSize
    askTotal += askSize
    bids.push({ price: bidPrice, size: bidSize, total: bidTotal })
    asks.push({ price: askPrice, size: askSize, total: askTotal })
  }

  return { bids, asks }
}

let tradeCounter = 0

/** Генерирует одну сделку в ленте (для периодического добавления) */
export function generateTrade(midPrice: number): Trade {
  tradeCounter += 1
  const side: Trade['side'] = Math.random() > 0.5 ? 'buy' : 'sell'
  const price = +(midPrice + (Math.random() - 0.5) * midPrice * 0.001).toFixed(2)
  const size = Math.round(1 + Math.random() * 200)
  return { id: `t-${Date.now()}-${tradeCounter}`, price, size, side, time: Date.now() }
}

export function generateInitialTrades(midPrice: number, count = 30): Trade[] {
  return Array.from({ length: count }, () => generateTrade(midPrice))
}
