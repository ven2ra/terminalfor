import { create } from 'zustand'
import { ThemeMode } from '@/types'

interface ThemeState {
  theme: ThemeMode
  toggleTheme: () => void
  setTheme: (theme: ThemeMode) => void
}

function applyThemeToDom(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme)
}

const storedTheme = (localStorage.getItem('terminal-theme') as ThemeMode | null) ?? 'dark'
applyThemeToDom(storedTheme)

/** Глобальное состояние темы оформления (тёмная/светлая) с сохранением в localStorage */
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: storedTheme,
  toggleTheme: () => {
    const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark'
    applyThemeToDom(next)
    localStorage.setItem('terminal-theme', next)
    set({ theme: next })
  },
  setTheme: (theme) => {
    applyThemeToDom(theme)
    localStorage.setItem('terminal-theme', theme)
    set({ theme })
  },
}))
