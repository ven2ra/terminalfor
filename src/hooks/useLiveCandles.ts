import { useEffect, useState } from 'react'
import { Candle } from '@/types'
import { CandleInterval, fetchCandles } from '@/api/client'

const INTRADAY_POLL_MS = 8000
const DAILY_PLUS_POLL_MS = 60000

/** Загружает реальные свечи с МосБиржи для инструмента/таймфрейма и периодически обновляет хвост ряда */
export function useLiveCandles(ticker: string, interval: CandleInterval) {
  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

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
    const pollMs = interval <= 60 ? INTRADAY_POLL_MS : DAILY_PLUS_POLL_MS
    const poll = setInterval(load, pollMs)
    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [ticker, interval])

  return { candles, loading }
}
