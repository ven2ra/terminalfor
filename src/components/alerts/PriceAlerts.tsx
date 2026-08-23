import { useState } from 'react'
import { Bell, Trash2 } from 'lucide-react'
import { Panel } from '@/components/common/Panel'
import { useMarketStore } from '@/store/useMarketStore'
import { useAlertsStore, AlertCondition } from '@/store/useAlertsStore'
import { formatPrice } from '@/lib/format'

interface PriceAlertsProps {
  onRemove?: () => void
}

/** Ценовые алерты: уведомление, когда цена бумаги достигает заданного уровня */
export function PriceAlerts({ onRemove }: PriceAlertsProps) {
  const { instruments, selectedTicker } = useMarketStore()
  const { alerts, addAlert, removeAlert } = useAlertsStore()
  const [ticker, setTicker] = useState(selectedTicker)
  const [condition, setCondition] = useState<AlertCondition>('above')
  const [price, setPrice] = useState('')

  const instrument = instruments.find((i) => i.ticker === ticker)

  const handleAdd = () => {
    const value = Number(price.replace(',', '.'))
    if (!ticker || !Number.isFinite(value) || value <= 0) return
    addAlert(ticker, condition, value)
    setPrice('')
  }

  const active = alerts.filter((a) => a.triggeredAt == null)
  const triggered = alerts.filter((a) => a.triggeredAt != null)

  return (
    <Panel title="Ценовые алерты" icon={<Bell size={14} />} noPadding draggable={!!onRemove} onRemove={onRemove}>
      <div className="flex h-full flex-col">
        <div className="shrink-0 space-y-2 border-b border-border-subtle p-3">
          <div className="flex gap-1.5">
            <select
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="min-w-0 flex-1 rounded border border-border-color bg-bg-base px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
            >
              {instruments.map((i) => (
                <option key={i.ticker} value={i.ticker}>
                  {i.ticker}
                </option>
              ))}
            </select>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as AlertCondition)}
              className="rounded border border-border-color bg-bg-base px-2 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="above">≥ выше</option>
              <option value="below">≤ ниже</option>
            </select>
          </div>
          <div className="flex gap-1.5">
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={instrument ? `Напр. ${formatPrice(instrument.lastPrice)}` : 'Цена'}
              inputMode="decimal"
              className="min-w-0 flex-1 rounded border border-border-color bg-bg-base px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
            <button
              onClick={handleAdd}
              className="shrink-0 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Создать
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-3">
          {alerts.length === 0 && (
            <div className="py-6 text-center text-xs text-text-muted">Нет активных алертов</div>
          )}

          {active.length > 0 && (
            <div className="space-y-1.5">
              {active.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md bg-bg-elevated px-2.5 py-2 text-xs">
                  <div>
                    <span className="font-semibold text-text-primary">{a.ticker}</span>{' '}
                    <span className="text-text-muted">{a.condition === 'above' ? '≥' : '≤'}</span>{' '}
                    <span className="font-tabular text-text-secondary">{formatPrice(a.targetPrice)}</span>
                  </div>
                  <button
                    onClick={() => removeAlert(a.id)}
                    aria-label="Удалить алерт"
                    className="text-text-muted transition-colors hover:text-sell"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {triggered.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="text-[11px] font-medium uppercase tracking-wide text-text-muted">Сработали</div>
              {triggered.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-md bg-buy-bg px-2.5 py-2 text-xs"
                >
                  <div>
                    <span className="font-semibold text-text-primary">{a.ticker}</span>{' '}
                    <span className="text-text-muted">{a.condition === 'above' ? '≥' : '≤'}</span>{' '}
                    <span className="font-tabular text-text-secondary">{formatPrice(a.targetPrice)}</span>
                  </div>
                  <button
                    onClick={() => removeAlert(a.id)}
                    aria-label="Удалить алерт"
                    className="text-text-muted transition-colors hover:text-sell"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}
