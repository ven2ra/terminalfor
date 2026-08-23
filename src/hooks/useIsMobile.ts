import { useEffect, useState } from 'react'

// 12-колоночная сетка react-grid-layout рассчитана на широкий десктоп —
// на планшетах она превращается в нечитаемую тесноту, а не адаптируется,
// поэтому вкладочная мобильная раскладка включается уже с этой ширины
const MOBILE_BREAKPOINT = 1024

/** true, когда ширина окна меньше брейкпоинта десктопной сетки виджетов */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handler = () => setIsMobile(mq.matches)
    handler()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isMobile
}
