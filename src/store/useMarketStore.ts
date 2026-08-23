import { create } from 'zustand'
import { Instrument, OrderBookData, Trade } from '@/types'
import { DEFAULT_TICKER, INSTRUMENTS } from '@/mock/instruments'
import { generateInitialTrades, generateOrderBook, generateTrade } from '@/mock/orderbook'
import { nextTick } from '@/mock/candles'

interface MarketState {
  instruments: Instrument[]
  selectedTicker: string
  orderBook: OrderBookData
  trades: Trade[]
  selectTicker: (ticker: string) => void
  tickPrices: () => void
  pushTrade: () => void
  toggleFavorite: (ticker: string) => void
}

function currentInstrument(instruments: Instrument[], ticker: string): Instrument {
  return instruments.find((i) => i.ticker === ticker) ?? instruments[0]
}

/** Рыночные данные: список инструментов, текущий выбранный тикер, стакан и лента сделок */
export const useMarketStore = create<MarketState>((set, get) => ({
  instruments: INSTRUMENTS,
  selectedTicker: DEFAULT_TICKER,
  orderBook: generateOrderBook(currentInstrument(INSTRUMENTS, DEFAULT_TICKER).lastPrice),
  trades: generateInitialTrades(currentInstrument(INSTRUMENTS, DEFAULT_TICKER).lastPrice),

  selectTicker: (ticker) => {
    const inst = currentInstrument(get().instruments, ticker)
    set({
      selectedTicker: ticker,
      orderBook: generateOrderBook(inst.lastPrice),
      trades: generateInitialTrades(inst.lastPrice),
    })
  },

  tickPrices: () => {
    set((state) => {
      const instruments = state.instruments.map((inst) => {
        const newPrice = +nextTick(inst.lastPrice).toFixed(2)
        const change = newPrice - (inst.lastPrice - inst.change)
        return {
          ...inst,
          lastPrice: newPrice,
          change,
          changePercent: (change / (newPrice - change)) * 100,
        }
      })
      const selected = currentInstrument(instruments, state.selectedTicker)
      return { instruments, orderBook: generateOrderBook(selected.lastPrice) }
    })
  },

  pushTrade: () => {
    set((state) => {
      const selected = currentInstrument(state.instruments, state.selectedTicker)
      const trade = generateTrade(selected.lastPrice)
      const trades = [trade, ...state.trades].slice(0, 60)
      return { trades }
    })
  },

  toggleFavorite: (ticker) => {
    set((state) => ({
      instruments: state.instruments.map((i) => (i.ticker === ticker ? { ...i, isFavorite: !i.isFavorite } : i)),
    }))
  },
}))
