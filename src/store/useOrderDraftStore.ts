import { create } from 'zustand'
import { OrderSide } from '@/types'

interface OrderDraft {
  price: number
  side: OrderSide
  /** Метка времени клика — чтобы повторный клик по той же цене тоже долетал до формы */
  at: number
}

interface OrderDraftState {
  draft: OrderDraft | null
  /** Клик по строке стакана: заявка на покупку по цене продавца (ask) и наоборот */
  setDraftFromBook: (price: number, bookSide: 'bid' | 'ask') => void
}

/** Связывает клик по стакану заявок с панелью выставления ордера */
export const useOrderDraftStore = create<OrderDraftState>((set) => ({
  draft: null,
  setDraftFromBook: (price, bookSide) =>
    set({ draft: { price, side: bookSide === 'ask' ? 'buy' : 'sell', at: Date.now() } }),
}))
