import { useEffect, useMemo, useRef, useState } from 'react'
import { Candle } from '@/types'
import { generateCandles, nextTick } from '@/mock/candles'

const STEP_SECONDS = 60 // таймфрейм М1 для демонстрации живого обновления

/**
 * Гарантирует строго возрастающий по времени ряд без дублей — на случай
 * двойного вызова обновляющей функции useState в React StrictMode (dev-режим).
 */
function sanitizeCandles(candles: Candle[]): Candle[] {
  const result: Candle[] = []
  for (const candle of candles) {
    const prev = result[result.length - 1]
    if (prev && candle.time <= prev.time) {
      result[result.length - 1] = candle.time === prev.time ? candle : prev
      continue
    }
    result.push(candle)
  }
  return result
}

/**
 * Держит историю свечей для выбранного инструмента и "оживляет" последнюю
 * свечу случайными приращениями цены, имитируя поток котировок с биржи.
 */
export function useLiveCandles(ticker: string, basePrice: number) {
  const [candles, setCandles] = useState<Candle[]>(() => generateCandles(basePrice, 180, STEP_SECONDS))
  const tickerRef = useRef(ticker)

  useEffect(() => {
    tickerRef.current = ticker
    setCandles(generateCandles(basePrice, 180, STEP_SECONDS))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker])

  useEffect(() => {
    const interval = setInterval(() => {
      setCandles((prev) => {
        if (prev.length === 0) return prev
        const last = prev[prev.length - 1]
        const now = Math.floor(Date.now() / 1000)
        const close = +nextTick(last.close).toFixed(2)
        const updated: Candle = {
          ...last,
          close,
          high: Math.max(last.high, close),
          low: Math.min(last.low, close),
          volume: last.volume + Math.round(Math.random() * 40),
        }

        // Новая свеча открывается строго на шаг вперёд от предыдущей — так
        // временной ряд остаётся монотонно возрастающим даже при дрейфе часов.
        if (now - last.time >= STEP_SECONDS) {
          const newTime = last.time + STEP_SECONDS
          const newCandle: Candle = { time: newTime, open: close, high: close, low: close, close, volume: 10 }
          return [...prev.slice(-299), updated, newCandle]
        }
        return [...prev.slice(0, -1), updated]
      })
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  return useMemo(() => sanitizeCandles(candles), [candles])
}
