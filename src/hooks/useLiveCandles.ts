import { useEffect, useState } from 'react'
import { Candle } from '@/types'
import { CandleInterval, fetchCandles } from '@/api/client'

const POLL_MS = 10000

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
    const poll = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [ticker, interval])

  return { candles, loading }
}
