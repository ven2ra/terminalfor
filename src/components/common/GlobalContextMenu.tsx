import { useEffect, useRef, useState } from 'react'
import { ArrowCounterClockwise, Moon, Sun } from '@phosphor-icons/react'
import { useDashboardStore } from '@/store/useDashboardStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useViewStore } from '@/store/useViewStore'
import { WIDGET_REGISTRY, WidgetType } from '@/dashboard/widgets'

interface MenuState {
  x: number
  y: number
}

const MENU_WIDTH = 240
// Список виджетов внутри сам ограничен max-h-64 (256px) + шапка/кнопки —
// с запасом достаточно, чтобы меню не вылезало за нижний край экрана
const MENU_MAX_HEIGHT = 360

/**
 * Своё меню по правому клику вместо системного браузерного — по всему
 * приложению, кроме мест со своим контекстным меню (бегущая строка тикеров
 * сама вызывает preventDefault, здесь это ловится через e.defaultPrevented
 * и глобальное меню не открывается поверх).
 *
 * Важно: это НЕ защита от просмотра кода страницы — такой защиты в браузере
 * не существует в принципе (DevTools открываются из меню браузера, исходники
 * всегда доступны через view-source:/скачивание). Это просто более полезное
 * действие по правому клику, чем пустое системное меню "Просмотреть код".
 */
export function GlobalContextMenu() {
  const [menu, setMenu] = useState<MenuState | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const { view } = useViewStore()
  const { theme, toggleTheme } = useThemeStore()
  const { widgets, addWidget, resetLayout } = useDashboardStore()

  const availableWidgets = (Object.keys(WIDGET_REGISTRY) as WidgetType[]).filter((t) => !widgets.includes(t))

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      // Локальное меню (например, бегущая строка тикеров) уже обработало клик —
      // не перекрываем его своим
      if (e.defaultPrevented) return
      e.preventDefault()
      const x = Math.max(8, Math.min(e.clientX, window.innerWidth - MENU_WIDTH - 8))
      const y = Math.max(8, Math.min(e.clientY, window.innerHeight - MENU_MAX_HEIGHT - 8))
      setMenu({ x, y })
    }
    const onClose = () => setMenu(null)
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose()

    document.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('scroll', onClose, true)
    window.addEventListener('resize', onClose)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('scroll', onClose, true)
      window.removeEventListener('resize', onClose)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!menu) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(null)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menu])

  if (!menu) return null

  return (
    <div
      ref={ref}
      style={{ left: menu.x, top: menu.y, width: MENU_WIDTH }}
      className="fixed z-50 overflow-hidden border border-border-color bg-bg-elevated py-1 shadow-panel"
    >
      {view === 'terminal' && (
        <>
          <div className="px-3 pb-1 pt-1.5 text-[9px] font-semibold uppercase tracking-wide text-text-muted">
            Добавить виджет
          </div>
          {availableWidgets.length === 0 && (
            <div className="px-3 py-1.5 text-xs text-text-muted">Все виджеты уже добавлены</div>
          )}
          <div className="max-h-64 overflow-auto">
            {availableWidgets.map((type) => (
              <button
                key={type}
                onClick={() => {
                  addWidget(type)
                  setMenu(null)
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-text-primary hover:bg-bg-hover"
              >
                {WIDGET_REGISTRY[type].icon}
                {WIDGET_REGISTRY[type].label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              resetLayout()
              setMenu(null)
            }}
            className="flex w-full items-center gap-2 border-t border-border-subtle px-3 py-1.5 text-left text-xs text-text-secondary hover:bg-bg-hover"
          >
            <ArrowCounterClockwise size={13} /> Сбросить раскладку
          </button>
          <div className="my-1 border-t border-border-subtle" />
        </>
      )}
      <button
        onClick={() => {
          toggleTheme()
          setMenu(null)
        }}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-text-primary hover:bg-bg-hover"
      >
        {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      </button>
    </div>
  )
}
