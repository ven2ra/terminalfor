import { Candle, NewsItem, Trade } from '@/types'

/** Сырые данные инструмента, приходящие с бэкенда (MOEX ISS) */
export interface SecurityDto {
  ticker: string
  name: string
  exchange: string
  currency: string
  lotSize: number
  lastPrice: number
  change: number
  changePercent: number
  volume: number
  turnover: number
  bid: number | null
  offer: number | null
  updatedAt: string | null
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Запрос ${url} завершился ошибкой ${res.status}`)
  return res.json() as Promise<T>
}

export function fetchSecurities(): Promise<SecurityDto[]> {
  return getJson('/api/securities')
}

/** Коды таймфреймов, поддерживаемые MOEX ISS: 1/10/60 мин, 24 — день, 7 — неделя, 31 — месяц */
export type CandleInterval = 1 | 10 | 60 | 24 | 7 | 31

export function fetchCandles(ticker: string, interval: CandleInterval): Promise<Candle[]> {
  return getJson(`/api/candles/${encodeURIComponent(ticker)}?interval=${interval}`)
}

export function fetchTrades(ticker: string): Promise<Trade[]> {
  return getJson(`/api/trades/${encodeURIComponent(ticker)}`)
}

export function fetchNews(): Promise<NewsItem[]> {
  return getJson('/api/news')
}
