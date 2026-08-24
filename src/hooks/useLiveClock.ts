import { useEffect, useState } from 'react'

/** Текущее время по Москве, тикает раз в секунду — для часов в бегущей строке */
export function useLiveClock(): string {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return now.toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow', hour12: false })
}
