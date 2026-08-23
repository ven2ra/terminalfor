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

/** Экспоненциальная скользящая средняя (EMA) по цене закрытия */
export function calcEMA(candles: Candle[], period: number): Array<{ time: number; value: number }> {
  if (candles.length < period) return []
  const k = 2 / (period + 1)
  const result: Array<{ time: number; value: number }> = []
  let sum = 0
  for (let i = 0; i < period; i++) sum += candles[i].close
  let prev = sum / period
  result.push({ time: candles[period - 1].time, value: prev })
  for (let i = period; i < candles.length; i++) {
    prev = candles[i].close * k + prev * (1 - k)
    result.push({ time: candles[i].time, value: prev })
  }
  return result
}

/** MACD(12,26,9): линия MACD, сигнальная линия, гистограмма */
export function calcMACD(
  candles: Candle[],
  fast = 12,
  slow = 26,
  signal = 9
): { macd: Array<{ time: number; value: number }>; signal: Array<{ time: number; value: number }>; histogram: Array<{ time: number; value: number }> } {
  const emaFast = calcEMA(candles, fast)
  const emaSlow = calcEMA(candles, slow)
  const slowByTime = new Map(emaSlow.map((p) => [p.time, p.value]))

  const macd = emaFast.filter((p) => slowByTime.has(p.time)).map((p) => ({ time: p.time, value: p.value - slowByTime.get(p.time)! }))
  if (macd.length < signal) return { macd, signal: [], histogram: [] }

  // Сигнальная линия — EMA от самой линии MACD (считаем на синтетических "свечах" с close=macd)
  const k = 2 / (signal + 1)
  let sum = 0
  for (let i = 0; i < signal; i++) sum += macd[i].value
  let prev = sum / signal
  const signalLine: Array<{ time: number; value: number }> = [{ time: macd[signal - 1].time, value: prev }]
  for (let i = signal; i < macd.length; i++) {
    prev = macd[i].value * k + prev * (1 - k)
    signalLine.push({ time: macd[i].time, value: prev })
  }
  const signalByTime = new Map(signalLine.map((p) => [p.time, p.value]))
  const histogram = macd.filter((p) => signalByTime.has(p.time)).map((p) => ({ time: p.time, value: p.value - signalByTime.get(p.time)! }))

  return { macd, signal: signalLine, histogram }
}

/** Полосы Боллинджера: SMA(period) ± stdDev × отклонение */
export function calcBollinger(
  candles: Candle[],
  period = 20,
  stdDevMult = 2
): { upper: Array<{ time: number; value: number }>; middle: Array<{ time: number; value: number }>; lower: Array<{ time: number; value: number }> } {
  const upper: Array<{ time: number; value: number }> = []
  const middle: Array<{ time: number; value: number }> = []
  const lower: Array<{ time: number; value: number }> = []

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close
    const mean = sum / period
    let variance = 0
    for (let j = i - period + 1; j <= i; j++) variance += (candles[j].close - mean) ** 2
    const stdDev = Math.sqrt(variance / period)
    middle.push({ time: candles[i].time, value: mean })
    upper.push({ time: candles[i].time, value: mean + stdDev * stdDevMult })
    lower.push({ time: candles[i].time, value: mean - stdDev * stdDevMult })
  }
  return { upper, middle, lower }
}

/** VWAP — средневзвешенная по объёму цена, накопительно от начала загруженного диапазона */
export function calcVWAP(candles: Candle[]): Array<{ time: number; value: number }> {
  const result: Array<{ time: number; value: number }> = []
  let cumPV = 0
  let cumVolume = 0
  for (const c of candles) {
    const typical = (c.high + c.low + c.close) / 3
    cumPV += typical * c.volume
    cumVolume += c.volume
    result.push({ time: c.time, value: cumVolume > 0 ? cumPV / cumVolume : typical })
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
