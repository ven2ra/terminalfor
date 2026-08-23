import { useState } from 'react'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { useOrderStore } from '@/store/useOrderStore'
import { Panel } from '@/components/common/Panel'
import { formatMoney, formatPercent, formatPrice } from '@/lib/format'
import { X } from 'lucide-react'

type Tab = 'positions' | 'orders' | 'structure'

const ASSET_COLORS = ['#3b82f6', '#26a65b', '#f5a623', '#a367f5', '#e0473b']

/** Портфель: открытые позиции, активные ордера, структура активов */
export function PortfolioPanel() {
  const { positions, account } = usePortfolioStore()
  const { orders, cancelOrder } = useOrderStore()
  const [tab, setTab] = useState<Tab>('positions')

  const activeOrders = orders.filter((o) => o.status === 'new' || o.status === 'partial')

  const structure = positions.map((p, idx) => ({
    ticker: p.ticker,
    value: p.size * p.currentPrice,
    color: ASSET_COLORS[idx % ASSET_COLORS.length],
  }))
  const totalValue = structure.reduce((sum, s) => sum + s.value, 0) || 1

  return (
    <Panel
      title="Портфель"
      noPadding
      actions={
        <div className="flex items-center gap-3 text-xs">
          <span className="text-text-muted">Баланс</span>
          <span className="font-tabular font-semibold text-text-primary">{formatMoney(account.balance)}</span>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 gap-1 border-b border-border-subtle px-3 pt-2">
          {([
            ['positions', 'Позиции'],
            ['orders', `Ордера${activeOrders.length ? ` (${activeOrders.length})` : ''}`],
            ['structure', 'Структура'],
          ] as [Tab, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === value ? 'bg-bg-elevated text-text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-3">
          {tab === 'positions' && (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-text-muted">
                  <th className="pb-2 font-medium">Тикер</th>
                  <th className="pb-2 font-medium">Сторона</th>
                  <th className="pb-2 text-right font-medium">Объём</th>
                  <th className="pb-2 text-right font-medium">Ср. цена</th>
                  <th className="pb-2 text-right font-medium">Тек. цена</th>
                  <th className="pb-2 text-right font-medium">P&L</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.ticker} className="border-t border-border-subtle">
                    <td className="py-2 font-semibold text-text-primary">{p.ticker}</td>
                    <td className={`py-2 font-medium ${p.side === 'buy' ? 'text-buy' : 'text-sell'}`}>
                      {p.side === 'buy' ? 'Long' : 'Short'}
                    </td>
                    <td className="py-2 text-right font-tabular text-text-secondary">{p.size}</td>
                    <td className="py-2 text-right font-tabular text-text-secondary">{formatPrice(p.avgPrice)}</td>
                    <td className="py-2 text-right font-tabular text-text-secondary">{formatPrice(p.currentPrice)}</td>
                    <td className={`py-2 text-right font-tabular font-semibold ${p.pnl >= 0 ? 'text-buy' : 'text-sell'}`}>
                      {formatMoney(p.pnl)}
                      <span className="ml-1 text-[10px] font-normal opacity-80">({formatPercent(p.pnlPercent)})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'orders' && (
            <>
              {activeOrders.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-text-muted">Нет активных заявок</div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-text-muted">
                      <th className="pb-2 font-medium">Тикер</th>
                      <th className="pb-2 font-medium">Тип</th>
                      <th className="pb-2 text-right font-medium">Цена</th>
                      <th className="pb-2 text-right font-medium">Объём</th>
                      <th className="pb-2 text-right font-medium">Статус</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {activeOrders.map((o) => (
                      <tr key={o.id} className="border-t border-border-subtle">
                        <td className="py-2 font-semibold text-text-primary">{o.ticker}</td>
                        <td className={`py-2 ${o.side === 'buy' ? 'text-buy' : 'text-sell'}`}>
                          {o.side === 'buy' ? 'Buy' : 'Sell'} · {o.type}
                        </td>
                        <td className="py-2 text-right font-tabular text-text-secondary">{formatPrice(o.price)}</td>
                        <td className="py-2 text-right font-tabular text-text-secondary">{o.size}</td>
                        <td className="py-2 text-right text-text-muted">Новая</td>
                        <td className="py-2 text-right">
                          <button onClick={() => cancelOrder(o.id)} className="text-text-muted hover:text-sell">
                            <X size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {tab === 'structure' && (
            <div className="flex flex-col gap-3">
              <div className="flex h-3 overflow-hidden rounded-full bg-bg-elevated">
                {structure.map((s) => (
                  <div key={s.ticker} style={{ width: `${(s.value / totalValue) * 100}%`, backgroundColor: s.color }} />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {structure.map((s) => (
                  <div key={s.ticker} className="flex items-center justify-between rounded-md bg-bg-elevated px-2.5 py-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="font-medium text-text-primary">{s.ticker}</span>
                    </div>
                    <span className="font-tabular text-text-secondary">{((s.value / totalValue) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}
