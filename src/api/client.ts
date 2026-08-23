import { Candle, NewsItem, Trade } from '@/types'

/** Сырые данные инструмента, приходящие с бэкенда (MOEX ISS) */
export interface SecurityDto {
  ticker: string
  name: string
  isin: string | null
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
  dayHigh: number | null
  dayLow: number | null
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

/** Довыгружает бары старше указанного времени (unix-секунды) — для подгрузки истории при прокрутке графика влево */
export function fetchOlderCandles(ticker: string, interval: CandleInterval, beforeSec: number): Promise<Candle[]> {
  return getJson(`/api/candles/${encodeURIComponent(ticker)}/older?interval=${interval}&before=${beforeSec}`)
}

export function fetchTrades(ticker: string): Promise<Trade[]> {
  return getJson(`/api/trades/${encodeURIComponent(ticker)}`)
}

export function fetchNews(): Promise<NewsItem[]> {
  return getJson('/api/news')
}

export interface TapeQuote {
  symbol: string
  name: string
  lastPrice: number
  change: number
  changePercent: number
}

export interface TapeCatalogEntry {
  symbol: string
  name: string
}

/** Небиржевые символы (валюты/индексы/нефть), доступные для добавления в бегущую строку — акции добавляются по тикеру напрямую */
export function fetchTapeCatalog(): Promise<TapeCatalogEntry[]> {
  return getJson('/api/tape/catalog')
}

export function fetchTapeQuotes(symbols: string[]): Promise<TapeQuote[]> {
  if (symbols.length === 0) return Promise.resolve([])
  return getJson(`/api/tape?symbols=${symbols.map(encodeURIComponent).join(',')}`)
}
