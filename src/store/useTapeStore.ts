import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_SYMBOLS = ['BR', 'VTBR', 'USD', 'EUR', 'IMOEX']

interface TapeState {
  symbols: string[]
  addSymbol: (symbol: string) => void
  removeSymbol: (symbol: string) => void
}

/** Список символов бегущей строки вверху терминала (persisted, редактируется через ПКМ) */
export const useTapeStore = create<TapeState>()(
  persist(
    (set, get) => ({
      symbols: DEFAULT_SYMBOLS,

      addSymbol: (symbol) => {
        const s = symbol.trim().toUpperCase()
        if (!s || get().symbols.includes(s)) return
        set((state) => ({ symbols: [...state.symbols, s] }))
      },

      removeSymbol: (symbol) => {
        set((state) => ({ symbols: state.symbols.filter((s) => s !== symbol) }))
      },
    }),
    { name: 'terminalfor-tape-v1' }
  )
)
