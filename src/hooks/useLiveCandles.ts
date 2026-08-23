import { useCallback, useEffect, useRef, useState } from 'react'
import { Candle } from '@/types'
import { CandleInterval, fetchCandles, fetchOlderCandles } from '@/api/client'

const INTRADAY_POLL_MS = 8000
const DAILY_PLUS_POLL_MS = 60000
// Коды 1/10/60 — реальные минуты, 24/7/31 — "код" дня/недели/месяца (а не 24/7/31 минут)
const MINUTE_INTERVALS = new Set([1, 10, 60])

/**
 * Загружает реальные свечи с МосБиржи для инструмента/таймфрейма, периодически
 * обновляет хвост ряда и умеет довыгружать более старую историю по запросу
 * (для бесконечной прокрутки графика назад — минутные/часовые бары изначально
 * грузятся только за недавний период, чтобы не тянуть миллионы баров сразу).
 */
export function useLiveCandles(ticker: string, interval: CandleInterval) {
  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  // Для дневных+ интервалов вся история уже грузится целиком за один раз —
  // довыгружать нечего. Для минутных изначально не знаем, есть ли ещё данные раньше.
  const [hasMore, setHasMore] = useState(MINUTE_INTERVALS.has(interval))
  const cancelledRef = useRef(false)
  // Синхронный флаг "запрос уже летит" — состояние loadingMore обновляется
  // асинхронно, а обработчик прокрутки может дёрнуть loadOlder несколько раз
  // за один тик до того, как React применит setLoadingMore(true)
  const fetchingOlderRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false
    fetchingOlderRef.current = false
    setLoading(true)
    setHasMore(MINUTE_INTERVALS.has(interval))
    // Сбрасываем предыдущие свечи сразу: иначе до завершения загрузки в стейте
    // остаются бары ПРЕЖНЕГО тикера/таймфрейма, и график успевает подогнать
    // масштаб под них ещё до прихода актуальных данных нового интервала.
    setCandles([])

    const load = async () => {
      try {
        const data = await fetchCandles(ticker, interval)
        if (!cancelledRef.current) {
          // fetchCandles всегда возвращает недавнее окно (последние ~500 баров
          // для интрадей). Периодический опрос не должен затирать им историю,
          // довыгруженную прокруткой назад через loadOlder, — сохраняем более
          // старые бары и обновляем только актуальный "хвост".
          setCandles((prev) => {
            if (prev.length === 0 || data.length === 0) return data
            const older = prev.filter((c) => c.time < data[0].time)
            return older.length > 0 ? [...older, ...data] : data
          })
          setLoading(false)
        }
      } catch {
        if (!cancelledRef.current) setLoading(false)
      }
    }

    load()
    const pollMs = MINUTE_INTERVALS.has(interval) ? INTRADAY_POLL_MS : DAILY_PLUS_POLL_MS
    const poll = setInterval(load, pollMs)
    return () => {
      cancelledRef.current = true
      clearInterval(poll)
    }
  }, [ticker, interval])

  const loadOlder = useCallback(async () => {
    if (fetchingOlderRef.current || !hasMore || candles.length === 0) return
    fetchingOlderRef.current = true
    const earliest = candles[0].time
    setLoadingMore(true)
    try {
      const older = await fetchOlderCandles(ticker, interval, earliest)
      if (cancelledRef.current) return
      if (older.length === 0) {
        setHasMore(false)
      } else {
        setCandles((prev) => (prev.length && prev[0].time === earliest ? [...older, ...prev] : prev))
      }
    } catch {
      // сеть подвела — попробуем ещё раз при следующей прокрутке
    } finally {
      fetchingOlderRef.current = false
      if (!cancelledRef.current) setLoadingMore(false)
    }
  }, [ticker, interval, candles, hasMore])

  return { candles, loading, loadOlder, loadingMore, hasMore }
}
