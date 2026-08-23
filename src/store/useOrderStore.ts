import { create } from 'zustand'
import { OrderSide, OrderType, PendingOrder } from '@/types'

interface NewOrderInput {
  ticker: string
  side: OrderSide
  type: OrderType
  price: number
  size: number
}

interface OrderState {
  orders: PendingOrder[]
  placeOrder: (input: NewOrderInput) => void
  cancelOrder: (id: string) => void
}

/** Активные и исполненные ордера пользователя (панель выставления заявок) */
export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  placeOrder: (input) =>
    set((state) => ({
      orders: [
        {
          id: `ord-${Date.now()}`,
          ticker: input.ticker,
          side: input.side,
          type: input.type,
          price: input.price,
          size: input.size,
          filled: input.type === 'market' ? input.size : 0,
          status: input.type === 'market' ? 'filled' : 'new',
          createdAt: Date.now(),
        },
        ...state.orders,
      ],
    })),
  cancelOrder: (id) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status: 'cancelled' as const } : o)),
    })),
}))
