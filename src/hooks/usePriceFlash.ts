import { useEffect, useRef, useState } from 'react'

/**
 * Даже при частом опросе изменение цены на копейку легко не заметить глазом.
 * Хук ловит момент, когда значение реально поменялось, и на короткое время
 * возвращает направление — компонент подсвечивает себя зелёным/красным.
 */
export function usePriceFlash(value: number): 'up' | 'down' | null {
  const prevRef = useRef(value)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    if (value === prevRef.current) return
    setFlash(value > prevRef.current ? 'up' : 'down')
    prevRef.current = value
    const timeout = setTimeout(() => setFlash(null), 700)
    return () => clearTimeout(timeout)
  }, [value])

  return flash
}
