import { useEffect } from 'react'

/**
 * Best-effort сдерживающий фактор от случайного открытия DevTools/просмотра
 * кода горячими клавишами — НЕ защита в каком-либо реальном смысле: любой,
 * кто действительно хочет открыть DevTools, сделает это через меню браузера
 * (или про F5-обновление страницы), а исходники фронтенда в любом случае
 * скачиваются напрямую (curl, "Сохранить страницу как", вкладка Network).
 * Блокирует только самые частые "случайные" сочетания клавиш.
 */
export function useDevtoolsDeterrent() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      const blocked =
        key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C'].includes(key)) ||
        ((e.ctrlKey || e.metaKey) && key === 'U')
      if (blocked) e.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
