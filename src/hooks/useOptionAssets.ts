import { useEffect, useState } from 'react'
import { fetchOptionAssets } from '@/api/client'
import { OptionAsset } from '@/types'

/** Список базовых активов опционов FORTS — общий для «Опционов» и «Доски опционов», грузится один раз на виджет */
export function useOptionAssets() {
  const [assets, setAssets] = useState<OptionAsset[]>([])

  useEffect(() => {
    let cancelled = false
    fetchOptionAssets()
      .then((data) => {
        if (!cancelled) setAssets(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return assets
}
