import { create } from 'zustand'
import { Instrument, OrderBookData, Trade } from '@/types'
import { fetchSecurities, fetchTrades, SecurityDto } from '@/api/client'
import { synthesizeOrderBook } from '@/mock/orderbook'
import { isWeekendSessionOpen } from '@/lib/tradingHours'

export const DEFAULT_TICKER = 'SBER'

function toInstrument(dto: SecurityDto, prevFavorite: boolean | undefined): Instrument {
  return {
    ticker: dto.ticker,
    name: dto.name,
    isin: dto.isin,
    exchange: dto.exchange,
    currency: dto.currency,
    lotSize: dto.lotSize,
    lastPrice: dto.lastPrice,
    change: dto.change,
    changePercent: dto.changePercent,
    volume: dto.volume,
    turnover: dto.turnover,
    bid: dto.bid,
    offer: dto.offer,
    dayHigh: dto.dayHigh,
    dayLow: dto.dayLow,
    isFavorite: prevFavorite,
  }
}

const DEFAULT_FAVORITES = new Set(['SBER', 'LKOH', 'GAZP', 'YDEX'])

interface MarketState {
  instruments: Instrument[]
  selectedTicker: string
  orderBook: OrderBookData
  trades: Trade[]
  status: 'loading' | 'ready' | 'error'
  loadSecurities: () => Promise<void>
  refreshOrderBook: () => void
  loadTrades: () => Promise<void>
  selectTicker: (ticker: string) => void
  toggleFavorite: (ticker: string) => void
}

function currentInstrument(instruments: Instrument[], ticker: string): Instrument | undefined {
  return instruments.find((i) => i.ticker === ticker)
}

/** Рыночные данные с МосБиржи: полный список бумаг TQBR, стакан, лента сделок по выбранному тикеру */
export const useMarketStore = create<MarketState>((set, get) => ({
  instruments: [],
  selectedTicker: DEFAULT_TICKER,
  orderBook: { bids: [], asks: [] },
  trades: [],
  status: 'loading',

  loadSecurities: async () => {
    try {
      const dtos = await fetchSecurities()
      const prevByTicker = new Map(get().instruments.map((i) => [i.ticker, i.isFavorite]))
      const instruments = dtos.map((dto) =>
        toInstrument(dto, prevByTicker.get(dto.ticker) ?? DEFAULT_FAVORITES.has(dto.ticker))
      )
      set({ instruments, status: 'ready' })
      get().refreshOrderBook()
    } catch {
      set({ status: 'error' })
    }
  },

  refreshOrderBook: () => {
    // По выходным вне сессии выходного дня (09:50–18:59 МСК) у нашего брокера
    // нет OTC-торгов (в отличие от Т-Инвестиций) — стакан замораживаем на
    // последнем известном состоянии и просто не опрашиваем дальше (UI
    // показывает "Торги закрыты")
    if (!isWeekendSessionOpen()) return
    const { instruments, selectedTicker } = get()
    const inst = currentInstrument(instruments, selectedTicker)
    if (!inst?.bid || !inst?.offer) return
    set({ orderBook: synthesizeOrderBook(inst.bid, inst.offer) })
  },

  loadTrades: async () => {
    // Та же логика, что и для стакана — лента сделок вне сессии выходного
    // дня тоже замораживается вместо показа несуществующих у брокера сделок
    if (!isWeekendSessionOpen()) return
    const ticker = get().selectedTicker
    try {
      const trades = await fetchTrades(ticker)
      if (get().selectedTicker === ticker) set({ trades })
    } catch {
      // сеть моргнула — просто оставляем предыдущую ленту до следующего опроса
    }
  },

  selectTicker: (ticker) => {
    // Стакан прошлого тикера не должен "просвечивать" под новым, пока не
    // придёт свежий (или пока не покажется оверлей "Торги закрыты")
    set({ selectedTicker: ticker, trades: [], orderBook: { bids: [], asks: [] } })
    get().refreshOrderBook()
    get().loadTrades()
  },

  toggleFavorite: (ticker) => {
    set((state) => ({
      instruments: state.instruments.map((i) => (i.ticker === ticker ? { ...i, isFavorite: !i.isFavorite } : i)),
    }))
  },
}))
