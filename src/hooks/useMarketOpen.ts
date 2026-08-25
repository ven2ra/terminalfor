import { useEffect, useState } from 'react'
import { isMarketOpenNow } from '@/lib/tradingHours'

/** Идут ли сейчас торги — тикается раз в минуту, чтобы граница сессии (открытие/закрытие) отражалась без перезагрузки страницы */
export function useMarketOpen(): boolean {
  const [open, setOpen] = useState(() => isMarketOpenNow())
  useEffect(() => {
    const id = setInterval(() => setOpen(isMarketOpenNow()), 60000)
    return () => clearInterval(id)
  }, [])
  return open
}
