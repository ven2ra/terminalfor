import { Candle } from '@/types'

/** Простая скользящая средняя (SMA) по цене закрытия */
export function calcSMA(candles: Candle[], period: number): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = []
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close
    result.push({ time: candles[i].time, value: sum / period })
  }
  return result
}

/** Индекс относительной силы (RSI) — классический период 14 */
export function calcRSI(candles: Candle[], period = 14): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = []
  let gains = 0
  let losses = 0

  for (let i = 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close
    const gain = diff > 0 ? diff : 0
    const loss = diff < 0 ? -diff : 0

    if (i <= period) {
      gains += gain
      losses += loss
      if (i === period) {
        const avgGain = gains / period
        const avgLoss = losses / period
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
        result.push({ time: candles[i].time, value: 100 - 100 / (1 + rs) })
      }
      continue
    }

    const prevAvgGain = gains / period
    const prevAvgLoss = losses / period
    const avgGain = (prevAvgGain * (period - 1) + gain) / period
    const avgLoss = (prevAvgLoss * (period - 1) + loss) / period
    gains = avgGain * period
    losses = avgLoss * period
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    result.push({ time: candles[i].time, value: 100 - 100 / (1 + rs) })
  }
  return result
}
