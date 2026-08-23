import { Candle } from '@/types'

export interface SRLevel {
  price: number
  type: 'support' | 'resistance'
  /** Сколько раз цена разворачивалась около этого уровня — грубая мера значимости */
  strength: number
}

/**
 * Автоматическое определение уровней поддержки/сопротивления: ищем локальные
 * экстремумы (пивоты) на окне PIVOT_WINDOW баров, группируем близкие цены
 * (в пределах CLUSTER_PCT друг от друга) и берём самые "сильные" кластеры.
 */
export function calcSupportResistance(candles: Candle[], maxLevels = 4): SRLevel[] {
  const PIVOT_WINDOW = 5
  if (candles.length < PIVOT_WINDOW * 2 + 1) return []

  const pivots: number[] = []
  for (let i = PIVOT_WINDOW; i < candles.length - PIVOT_WINDOW; i++) {
    const window = candles.slice(i - PIVOT_WINDOW, i + PIVOT_WINDOW + 1)
    const c = candles[i]
    if (c.high === Math.max(...window.map((w) => w.high))) pivots.push(c.high)
    if (c.low === Math.min(...window.map((w) => w.low))) pivots.push(c.low)
  }
  if (pivots.length === 0) return []

  const lastPrice = candles[candles.length - 1].close
  const CLUSTER_PCT = 0.006 // 0.6% — цены в этом диапазоне считаются одним уровнем

  const clusters: Array<{ sum: number; count: number }> = []
  for (const p of pivots.sort((a, b) => a - b)) {
    const last = clusters[clusters.length - 1]
    if (last && Math.abs(p - last.sum / last.count) / p < CLUSTER_PCT) {
      last.sum += p
      last.count += 1
    } else {
      clusters.push({ sum: p, count: 1 })
    }
  }

  return clusters
    .map((c) => ({ price: c.sum / c.count, strength: c.count }))
    .sort((a, b) => b.strength - a.strength)
    .slice(0, maxLevels)
    .map((c) => ({
      price: c.price,
      strength: c.strength,
      type: (c.price >= lastPrice ? 'resistance' : 'support') as SRLevel['type'],
    }))
    .sort((a, b) => b.price - a.price)
}
