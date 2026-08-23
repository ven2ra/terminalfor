/** Общие типы данных торгового терминала */

export type ThemeMode = 'dark' | 'light'

/** Раздел терминала, выбранный в верхней навигации */
export type ViewMode = 'terminal' | 'charts' | 'analytics' | 'reports'

export type AssetType = 'share' | 'fund' | 'bond' | 'future'

export interface Instrument {
  ticker: string
  name: string
  isin: string | null
  exchange: string
  currency: string
  assetType: AssetType
  /** Облигации котируются в % от номинала, а не в валюте */
  priceUnit: 'currency' | 'percent'
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
  isFavorite?: boolean
}

export interface Candle {
  time: number // unix seconds
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type OrderSide = 'buy' | 'sell'
export type OrderType = 'market' | 'limit' | 'stop'
export type OrderStatus = 'new' | 'partial' | 'filled' | 'cancelled'

export interface OrderBookLevel {
  price: number
  size: number
  total: number
}

export interface OrderBookData {
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
}

export interface Trade {
  id: string
  price: number
  size: number
  side: OrderSide
  /** Время сделки по MSK в формате HH:MM:SS, как приходит с MOEX ISS */
  time: string
}

export interface PendingOrder {
  id: string
  ticker: string
  side: OrderSide
  type: OrderType
  price: number
  size: number
  filled: number
  status: OrderStatus
  createdAt: number
}

export interface Position {
  ticker: string
  side: OrderSide
  size: number
  avgPrice: number
  currentPrice: number
  pnl: number
  pnlPercent: number
}

export interface NewsItem {
  id: string
  title: string
  source: string
  link: string
  time: number
  tag: 'market' | 'company' | 'politics' | 'society'
  important?: boolean
}

export interface AccountSummary {
  balance: number
  equity: number
  availableMargin: number
  usedMargin: number
  todayPnl: number
  todayPnlPercent: number
}
