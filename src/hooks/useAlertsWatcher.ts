import { useEffect } from 'react'
import { useMarketStore } from '@/store/useMarketStore'
import { useAlertsStore } from '@/store/useAlertsStore'

/** Проверяет живые котировки на срабатывание ценовых алертов при каждом обновлении списка инструментов */
export function useAlertsWatcher() {
  const instruments = useMarketStore((s) => s.instruments)
  const alerts = useAlertsStore((s) => s.alerts)
  const markTriggered = useAlertsStore((s) => s.markTriggered)

  useEffect(() => {
    if (instruments.length === 0) return
    const priceByTicker = new Map(instruments.map((i) => [i.ticker, i.lastPrice]))
    const now = Date.now()

    for (const alert of alerts) {
      if (alert.triggeredAt != null) continue
      const price = priceByTicker.get(alert.ticker)
      if (price == null) continue
      const hit = alert.condition === 'above' ? price >= alert.targetPrice : price <= alert.targetPrice
      if (hit) markTriggered(alert.id, now)
    }
  }, [instruments, alerts, markTriggered])
}
