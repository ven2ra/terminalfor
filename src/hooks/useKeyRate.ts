import { useEffect, useState } from 'react'
import { fetchKeyRate, KeyRate } from '@/api/client'

/** Ключевая ставка ЦБ РФ — грузится один раз при монтировании (бэкенд сам кэширует на 12ч, ставка меняется раз в 6-7 недель) */
export function useKeyRate(): KeyRate | null {
  const [keyRate, setKeyRate] = useState<KeyRate | null>(null)
  useEffect(() => {
    fetchKeyRate()
      .then(setKeyRate)
      .catch(() => {})
  }, [])
  return keyRate
}
