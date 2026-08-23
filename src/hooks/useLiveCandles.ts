import { useEffect, useState } from 'react'
import { Candle } from '@/types'
import { CandleInterval, fetchCandles } from '@/api/client'

const INTRADAY_POLL_MS = 8000
const DAILY_PLUS_POLL_MS = 60000
// Коды 1/10/60 — реальные минуты, 24/7/31 — "код" дня/недели/месяца (а не 24/7/31 минут)
const MINUTE_INTERVALS = new Set([1, 10, 60])

/** Загружает реальные свечи с МосБиржи для инструмента/таймфрейма и периодически обновляет хвост ряда */
export function useLiveCandles(ticker: string, interval: CandleInterval) {
  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    // Сбрасываем предыдущие свечи сразу: иначе до завершения загрузки в стейте
    // остаются бары ПРЕЖНЕГО тикера/таймфрейма, и график успевает подогнать
    // масштаб под них ещё до прихода актуальных данных нового интервала.
    setCandles([])

    const load = async () => {
      try {
        const data = await fetchCandles(ticker, interval)
        if (!cancelled) {
          setCandles(data)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const pollMs = MINUTE_INTERVALS.has(interval) ? INTRADAY_POLL_MS : DAILY_PLUS_POLL_MS
    const poll = setInterval(load, pollMs)
    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [ticker, interval])

  return { candles, loading }
}
