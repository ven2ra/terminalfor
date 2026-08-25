import { useEffect } from 'react'
import { create } from 'zustand'
import { fetchInstrumentFlags, InstrumentFlags } from '@/api/client'

interface InstrumentFlagsState {
  // undefined — ещё не запрашивали, null — запрос идёт
  byTicker: Record<string, InstrumentFlags | null>
  ensure: (ticker: string) => void
}

/**
 * Кэш признаков "квал.инвестор"/"повышенный риск" по тикеру — запрашивается
 * лениво (при открытии графика/заявки), а не для всего списка инструментов
 * сразу: у ISS это отдельный запрос на бумагу, а не поле в общем списке.
 */
export const useInstrumentFlagsStore = create<InstrumentFlagsState>((set, get) => ({
  byTicker: {},
  ensure: (ticker) => {
    if (ticker in get().byTicker) return
    set((state) => ({ byTicker: { ...state.byTicker, [ticker]: null } }))
    fetchInstrumentFlags(ticker)
      .then((flags) => set((state) => ({ byTicker: { ...state.byTicker, [ticker]: flags } })))
      .catch(() =>
        set((state) => ({
          byTicker: {
            ...state.byTicker,
            [ticker]: { isQualifiedOnly: false, highRisk: false, hasDefault: false, hasTechnicalDefault: false },
          },
        }))
      )
  },
}))

/** Признаки бумаги по тикеру — запускает загрузку при первом обращении, до этого возвращает null */
export function useInstrumentFlags(ticker: string | undefined): InstrumentFlags | null {
  const byTicker = useInstrumentFlagsStore((s) => s.byTicker)
  const ensure = useInstrumentFlagsStore((s) => s.ensure)

  useEffect(() => {
    if (ticker) ensure(ticker)
  }, [ticker, ensure])

  return (ticker && byTicker[ticker]) || null
}
