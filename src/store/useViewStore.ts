import { create } from 'zustand'
import { ViewMode } from '@/types'

interface ViewState {
  view: ViewMode
  setView: (view: ViewMode) => void
}

/** Текущий раздел терминала, переключаемый кнопками верхней навигации */
export const useViewStore = create<ViewState>((set) => ({
  view: 'terminal',
  setView: (view) => set({ view }),
}))
