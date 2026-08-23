/** Общие типы данных торгового терминала */

export type ThemeMode = 'dark' | 'light'

export interface Instrument {
  ticker: string
  name: string
  exchange: string
  currency: string
  lastPrice: number
  change: number
  changePercent: number
  volume: number
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
  time: number
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
  time: number
  tag: 'market' | 'company' | 'macro' | 'crypto'
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
