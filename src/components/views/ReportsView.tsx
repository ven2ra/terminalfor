import { format } from 'date-fns'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { useOrderStore } from '@/store/useOrderStore'
import { Panel } from '@/components/common/Panel'
import { formatMoney, formatPercent, formatPrice } from '@/lib/format'

const STATUS_LABELS: Record<string, string> = {
  new: 'Новая',
  partial: 'Частично исполнена',
  filled: 'Исполнена',
  cancelled: 'Отменена',
}

/** Раздел «Отчёты»: сводка по счёту и полная история заявок за сессию */
export function ReportsView() {
  const { account, positions } = usePortfolioStore()
  const { orders } = useOrderStore()

  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0)

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['Баланс', formatMoney(account.balance)],
            ['Капитал (equity)', formatMoney(account.equity)],
            ['Доступная маржа', formatMoney(account.availableMargin)],
            ['P&L по открытым позициям', formatMoney(totalPnl)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border-color bg-bg-elevated p-3">
              <div className="text-xs text-text-muted">{label}</div>
              <div className="mt-1 font-tabular text-lg font-bold text-text-primary">{value}</div>
            </div>
          ))}
        </div>

        <Panel title={`История заявок · ${orders.length}`} noPadding className="rounded-lg border border-border-color">
          {orders.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-xs text-text-muted">
              Заявок пока не было — разместите ордер в терминале
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-left text-text-muted">
                  <th className="px-3 py-2 font-medium">Время</th>
                  <th className="px-3 py-2 font-medium">Тикер</th>
                  <th className="px-3 py-2 font-medium">Сторона</th>
                  <th className="px-3 py-2 font-medium">Тип</th>
                  <th className="px-3 py-2 text-right font-medium">Цена</th>
                  <th className="px-3 py-2 text-right font-medium">Объём</th>
                  <th className="px-3 py-2 text-right font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-border-subtle">
                    <td className="px-3 py-1.5 font-tabular text-text-muted">{format(o.createdAt, 'HH:mm:ss')}</td>
                    <td className="px-3 py-1.5 font-semibold text-text-primary">{o.ticker}</td>
                    <td className={`px-3 py-1.5 font-medium ${o.side === 'buy' ? 'text-buy' : 'text-sell'}`}>
                      {o.side === 'buy' ? 'Покупка' : 'Продажа'}
                    </td>
                    <td className="px-3 py-1.5 text-text-secondary">{o.type}</td>
                    <td className="px-3 py-1.5 text-right font-tabular text-text-secondary">{formatPrice(o.price)}</td>
                    <td className="px-3 py-1.5 text-right font-tabular text-text-secondary">{o.size}</td>
                    <td className="px-3 py-1.5 text-right text-text-muted">{STATUS_LABELS[o.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Структура открытых позиций" noPadding className="rounded-lg border border-border-color">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-left text-text-muted">
                <th className="px-3 py-2 font-medium">Тикер</th>
                <th className="px-3 py-2 text-right font-medium">Объём</th>
                <th className="px-3 py-2 text-right font-medium">Ср. цена</th>
                <th className="px-3 py-2 text-right font-medium">Тек. цена</th>
                <th className="px-3 py-2 text-right font-medium">P&L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.ticker} className="border-b border-border-subtle">
                  <td className="px-3 py-1.5 font-semibold text-text-primary">{p.ticker}</td>
                  <td className="px-3 py-1.5 text-right font-tabular text-text-secondary">{p.size}</td>
                  <td className="px-3 py-1.5 text-right font-tabular text-text-secondary">{formatPrice(p.avgPrice)}</td>
                  <td className="px-3 py-1.5 text-right font-tabular text-text-secondary">{formatPrice(p.currentPrice)}</td>
                  <td className={`px-3 py-1.5 text-right font-tabular font-semibold ${p.pnl >= 0 ? 'text-buy' : 'text-sell'}`}>
                    {formatMoney(p.pnl)} <span className="opacity-80">({formatPercent(p.pnlPercent)})</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  )
}
