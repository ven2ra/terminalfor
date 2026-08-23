import { Candle } from '@/types'

/**
 * Генерирует реалистичный ряд свечей методом случайного блуждания
 * с лёгким трендом и всплесками объёма — используется как история для графика.
 */
export function generateCandles(basePrice: number, count: number, stepSeconds: number): Candle[] {
  const candles: Candle[] = []
  let price = basePrice * 0.97
  const now = Math.floor(Date.now() / 1000)
  const startTime = now - count * stepSeconds

  for (let i = 0; i < count; i++) {
    const time = startTime + i * stepSeconds
    const volatility = basePrice * 0.004
    const drift = (Math.random() - 0.48) * volatility
    const open = price
    let close = open + drift
    const wick = basePrice * 0.003
    const high = Math.max(open, close) + Math.random() * wick
    const low = Math.min(open, close) - Math.random() * wick
    const volume = Math.round(1000 + Math.random() * 9000 + (Math.random() > 0.9 ? 15000 : 0))

    candles.push({ time, open, high, low, close, volume })
    price = close
  }
  return candles
}

/** Следующая "живая" свеча — приращение к последней цене для тикера в реальном времени */
export function nextTick(lastClose: number): number {
  const volatility = lastClose * 0.0015
  return lastClose + (Math.random() - 0.5) * volatility
}
