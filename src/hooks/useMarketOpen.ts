import { useEffect, useState } from 'react'
import { isMarketOpenNow, msUntilMarketOpen } from '@/lib/tradingHours'

/** Идут ли сейчас торги — тикается раз в минуту, чтобы граница сессии (открытие/закрытие) отражалась без перезагрузки страницы */
export function useMarketOpen(): boolean {
  const [open, setOpen] = useState(() => isMarketOpenNow())
  useEffect(() => {
    const id = setInterval(() => setOpen(isMarketOpenNow()), 60000)
    return () => clearInterval(id)
  }, [])
  return open
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

/**
 * Обратный отсчёт до открытия биржи (09:50 МСК) в формате ЧЧ:ММ:СС — null,
 * пока рынок открыт. msUntilMarketOpen() всегда считает "до ближайшего
 * 09:50" (даже если сейчас разгар торгового дня), поэтому дополнительно
 * сверяемся с isMarketOpenNow()
 */
export function useMarketOpenCountdown(): string | null {
  const [state, setState] = useState(() => ({ open: isMarketOpenNow(), msLeft: msUntilMarketOpen() }))
  useEffect(() => {
    const id = setInterval(() => setState({ open: isMarketOpenNow(), msLeft: msUntilMarketOpen() }), 1000)
    return () => clearInterval(id)
  }, [])
  return state.open ? null : formatCountdown(state.msLeft)
}
