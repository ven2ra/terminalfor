import { ClipboardList, X } from 'lucide-react'
import { useOrderStore } from '@/store/useOrderStore'
import { Panel } from '@/components/common/Panel'
import { formatPrice } from '@/lib/format'

interface ActiveOrdersPanelProps {
  onRemove?: () => void
}

/** Отдельное окно активных (неисполненных) заявок — независимое от портфеля */
export function ActiveOrdersPanel({ onRemove }: ActiveOrdersPanelProps) {
  const { orders, cancelOrder } = useOrderStore()
  const activeOrders = orders.filter((o) => o.status === 'new' || o.status === 'partial')

  return (
    <Panel
      title={`Активные заявки${activeOrders.length ? ` · ${activeOrders.length}` : ''}`}
      noPadding
      draggable={!!onRemove}
      onRemove={onRemove}
    >
      {activeOrders.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-text-muted">
          <ClipboardList size={28} className="opacity-40" />
          <span className="text-xs">Активных заявок нет</span>
        </div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-subtle text-left text-text-muted">
              <th className="px-3 py-2 font-medium">Тикер</th>
              <th className="px-3 py-2 font-medium">Тип</th>
              <th className="px-3 py-2 text-right font-medium">Цена</th>
              <th className="px-3 py-2 text-right font-medium">Объём</th>
              <th className="px-3 py-2 text-right font-medium">Статус</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {activeOrders.map((o) => (
              <tr key={o.id} className="border-b border-border-subtle">
                <td className="px-3 py-2 font-semibold text-text-primary">{o.ticker}</td>
                <td className={`px-3 py-2 ${o.side === 'buy' ? 'text-buy' : 'text-sell'}`}>
                  {o.side === 'buy' ? 'Buy' : 'Sell'} · {o.type}
                </td>
                <td className="px-3 py-2 text-right font-tabular text-text-secondary">{formatPrice(o.price)}</td>
                <td className="px-3 py-2 text-right font-tabular text-text-secondary">{o.size}</td>
                <td className="px-3 py-2 text-right text-text-muted">Новая</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => cancelOrder(o.id)} className="text-text-muted hover:text-sell">
                    <X size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  )
}
