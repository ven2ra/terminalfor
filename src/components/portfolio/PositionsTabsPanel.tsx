import { useState } from 'react'
import { Check, X } from '@phosphor-icons/react'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { useOrderStore } from '@/store/useOrderStore'
import { Panel } from '@/components/common/Panel'
import { formatMoney, formatPercent, formatPrice } from '@/lib/format'
import { ORDER_TYPE_LABELS } from '@/lib/orderLabels'

interface PositionsTabsPanelProps {
  onRemove?: () => void
}

type Tab = 'positions' | 'active' | 'history'

/** Единая панель под графиком: открытые позиции, активные заявки и история сделок — три вкладки одного виджета */
export function PositionsTabsPanel({ onRemove }: PositionsTabsPanelProps) {
  const { positions } = usePortfolioStore()
  const { orders, cancelOrder } = useOrderStore()
  const [tab, setTab] = useState<Tab>('positions')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const activeOrders = orders.filter((o) => o.status === 'new' || o.status === 'partial')
  const history = orders.filter((o) => o.status === 'filled' || o.status === 'cancelled')
  const lastUpdate = orders[0]
    ? new Date(orders[0].createdAt).toLocaleTimeString('ru-RU', { hour12: false })
    : new Date().toLocaleTimeString('ru-RU', { hour12: false })

  return (
    <Panel
      title="Позиции и заявки"
      noPadding
      draggable={!!onRemove}
      onRemove={onRemove}
      actions={<span className="font-tabular text-[10px] text-text-muted">Обновлено {lastUpdate}</span>}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-9 shrink-0 items-stretch border-b border-border-subtle bg-bg-head px-2.5">
          {(
            [
              ['positions', 'Позиции', positions.length],
              ['active', 'Активные заявки', activeOrders.length],
              ['history', 'История сделок', null],
            ] as [Tab, string, number | null][]
          ).map(([value, label, count]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`flex items-center gap-1.5 border-b-2 px-2.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                tab === value ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              {label}
              {count != null && count > 0 && (
                <span className="grid h-3.5 min-w-[14px] place-items-center bg-bg-elevated px-1 text-[8px] text-text-secondary">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {tab === 'positions' && (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-head text-left text-[9px] uppercase tracking-wide text-text-muted">
                  <th className="h-7 px-3 font-semibold">Инструмент</th>
                  <th className="h-7 px-3 text-right font-semibold">Кол-во</th>
                  <th className="h-7 px-3 text-right font-semibold">Ср. цена</th>
                  <th className="h-7 px-3 text-right font-semibold">Тек. цена</th>
                  <th className="h-7 px-3 text-right font-semibold">P&L</th>
                  <th className="h-7 px-3 text-right font-semibold">P&L, %</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.ticker} className="border-b border-border-subtle hover:bg-accent/[.045]">
                    <td className="h-[34px] px-3">
                      <div className="font-bold text-text-primary">{p.ticker}</div>
                      <div className="text-[9px] text-text-muted">{p.side === 'buy' ? 'Лонг' : 'Шорт'}</div>
                    </td>
                    <td className="h-[34px] px-3 text-right font-tabular text-text-secondary">{p.size}</td>
                    <td className="h-[34px] px-3 text-right font-tabular text-text-secondary">{formatPrice(p.avgPrice)}</td>
                    <td className="h-[34px] px-3 text-right font-tabular text-text-secondary">{formatPrice(p.currentPrice)}</td>
                    <td className={`h-[34px] px-3 text-right font-tabular ${p.pnl >= 0 ? 'text-buy' : 'text-sell'}`}>
                      {formatMoney(p.pnl)}
                    </td>
                    <td className={`h-[34px] px-3 text-right font-tabular ${p.pnl >= 0 ? 'text-buy' : 'text-sell'}`}>
                      {formatPercent(p.pnlPercent)}
                    </td>
                  </tr>
                ))}
                {positions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-text-muted">
                      Открытых позиций нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {tab === 'active' && (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-head text-left text-[9px] uppercase tracking-wide text-text-muted">
                  <th className="h-7 px-3 font-semibold">Время</th>
                  <th className="h-7 px-3 font-semibold">Инструмент</th>
                  <th className="h-7 px-3 font-semibold">Сторона</th>
                  <th className="h-7 px-3 text-right font-semibold">Цена</th>
                  <th className="h-7 px-3 text-right font-semibold">Кол-во</th>
                  <th className="h-7 px-3 font-semibold">Статус</th>
                  <th className="h-7 px-3" />
                </tr>
              </thead>
              <tbody>
                {activeOrders.map((o) => (
                  <tr key={o.id} className="border-b border-border-subtle hover:bg-accent/[.045]">
                    <td className="h-[34px] px-3 font-tabular text-text-muted">
                      {new Date(o.createdAt).toLocaleTimeString('ru-RU', { hour12: false })}
                    </td>
                    <td className="h-[34px] px-3 font-bold text-text-primary">{o.ticker}</td>
                    <td className="h-[34px] px-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[9px] font-semibold ${
                          o.side === 'buy' ? 'bg-buy-bg text-buy' : 'bg-sell-bg text-sell'
                        }`}
                      >
                        {o.side === 'buy' ? 'Покупка' : 'Продажа'}
                      </span>
                    </td>
                    <td className="h-[34px] px-3 text-right font-tabular text-text-secondary">
                      {formatPrice(o.price)} · {ORDER_TYPE_LABELS[o.type]}
                    </td>
                    <td className="h-[34px] px-3 text-right font-tabular text-text-secondary">{o.size}</td>
                    <td className="h-[34px] px-3 text-text-muted">Активна</td>
                    <td className="h-[34px] px-3 text-right">
                      {confirmingId === o.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              cancelOrder(o.id)
                              setConfirmingId(null)
                            }}
                            title="Подтвердить отмену"
                            className="rounded bg-sell-bg p-0.5 text-sell hover:brightness-110"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setConfirmingId(null)}
                            title="Не отменять"
                            className="rounded p-0.5 text-text-muted hover:text-text-secondary"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmingId(o.id)}
                          title="Отменить заявку"
                          className="text-text-muted hover:text-sell"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {activeOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-text-muted">
                      Активных заявок нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {tab === 'history' && (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-head text-left text-[9px] uppercase tracking-wide text-text-muted">
                  <th className="h-7 px-3 font-semibold">Время</th>
                  <th className="h-7 px-3 font-semibold">Инструмент</th>
                  <th className="h-7 px-3 font-semibold">Сторона</th>
                  <th className="h-7 px-3 text-right font-semibold">Цена</th>
                  <th className="h-7 px-3 text-right font-semibold">Кол-во</th>
                  <th className="h-7 px-3 font-semibold">Статус</th>
                </tr>
              </thead>
              <tbody>
                {history.map((o) => (
                  <tr key={o.id} className="border-b border-border-subtle hover:bg-accent/[.045]">
                    <td className="h-[34px] px-3 font-tabular text-text-muted">
                      {new Date(o.createdAt).toLocaleTimeString('ru-RU', { hour12: false })}
                    </td>
                    <td className="h-[34px] px-3 font-bold text-text-primary">{o.ticker}</td>
                    <td className="h-[34px] px-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[9px] font-semibold ${
                          o.side === 'buy' ? 'bg-buy-bg text-buy' : 'bg-sell-bg text-sell'
                        }`}
                      >
                        {o.side === 'buy' ? 'Покупка' : 'Продажа'}
                      </span>
                    </td>
                    <td className="h-[34px] px-3 text-right font-tabular text-text-secondary">{formatPrice(o.price)}</td>
                    <td className="h-[34px] px-3 text-right font-tabular text-text-secondary">{o.size}</td>
                    <td className="h-[34px] px-3 text-text-muted">{o.status === 'filled' ? 'Исполнена' : 'Отменена'}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-text-muted">
                      Сделок пока не было
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Panel>
  )
}
