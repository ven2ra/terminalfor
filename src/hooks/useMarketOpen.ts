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
 * пока рынок открыт. Тикает раз в секунду ТОЛЬКО пока рынок закрыт (иначе
 * бессмысленно перерисовывает компонент раз в секунду весь день, хотя
 * значение всё равно null) — пока рынок открыт, проверяем раз в минуту, не
 * закрылся ли он, той же периодичностью, что и useMarketOpen
 */
export function useMarketOpenCountdown(): string | null {
  const [state, setState] = useState(() => ({ open: isMarketOpenNow(), msLeft: msUntilMarketOpen() }))
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    const tick = () => {
      const open = isMarketOpenNow()
      setState({ open, msLeft: open ? 0 : msUntilMarketOpen() })
      timeoutId = setTimeout(tick, open ? 60000 : 1000)
    }
    tick()
    return () => clearTimeout(timeoutId)
  }, [])
  return state.open ? null : formatCountdown(state.msLeft)
}
