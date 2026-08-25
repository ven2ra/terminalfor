import { useEffect, useState } from 'react'
import { fetchKeyRate, KeyRate } from '@/api/client'

const RETRY_DELAY_MS = 15000

/**
 * Ключевая ставка ЦБ РФ — грузится при монтировании (бэкенд сам кэширует на
 * 12ч, ставка меняется раз в 6-7 недель). При сбое (сеть моргнула) повторяем
 * через RETRY_DELAY_MS, а не оставляем "..." до перезагрузки страницы.
 */
export function useKeyRate(): KeyRate | null {
  const [keyRate, setKeyRate] = useState<KeyRate | null>(null)
  useEffect(() => {
    let cancelled = false
    let retryId: ReturnType<typeof setTimeout>

    const load = () => {
      fetchKeyRate()
        .then((rate) => {
          if (!cancelled) setKeyRate(rate)
        })
        .catch(() => {
          if (!cancelled) retryId = setTimeout(load, RETRY_DELAY_MS)
        })
    }
    load()

    return () => {
      cancelled = true
      clearTimeout(retryId)
    }
  }, [])
  return keyRate
}
