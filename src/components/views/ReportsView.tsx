import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { DownloadSimple } from '@phosphor-icons/react'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { useOrderStore } from '@/store/useOrderStore'
import { useEquityHistoryStore } from '@/store/useEquityHistoryStore'
import { useMarketStore } from '@/store/useMarketStore'
import { Panel } from '@/components/common/Panel'
import { EquityChart } from '@/components/reports/EquityChart'
import { formatMoney, formatPercent, formatPrice } from '@/lib/format'
import { downloadCsv } from '@/lib/exportCsv'
import { AssetType } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  new: 'Новая',
  partial: 'Частично исполнена',
  filled: 'Исполнена',
  cancelled: 'Отменена',
}

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  share: 'Акции',
  fund: 'Фонды',
  bond: 'Облигации',
  future: 'Фьючерсы',
  option: 'Опционы',
}

type Period = 'day' | 'week' | 'month' | 'all'
const PERIODS: Array<{ value: Period; label: string; ms: number | null }> = [
  { value: 'day', label: 'День', ms: 24 * 60 * 60 * 1000 },
  { value: 'week', label: 'Неделя', ms: 7 * 24 * 60 * 60 * 1000 },
  { value: 'month', label: 'Месяц', ms: 30 * 24 * 60 * 60 * 1000 },
  { value: 'all', label: 'Всё', ms: null },
]

/** Раздел «Отчёты»: сводка по счёту, доходность, история заявок и структура портфеля по классам активов */
export function ReportsView() {
  const { account, positions } = usePortfolioStore()
  const { orders } = useOrderStore()
  const { points } = useEquityHistoryStore()
  const { instruments } = useMarketStore()
  const [period, setPeriod] = useState<Period>('week')

  const cutoff = useMemo(() => {
    const ms = PERIODS.find((p) => p.value === period)?.ms
    return ms ? Date.now() - ms : 0
  }, [period])

  const filteredOrders = useMemo(() => orders.filter((o) => o.createdAt >= cutoff), [orders, cutoff])
  const filteredEquityPoints = useMemo(() => points.filter((p) => p.time >= cutoff), [points, cutoff])

  const assetTypeByTicker = useMemo(() => new Map(instruments.map((i) => [i.ticker, i.assetType])), [instruments])

  const positionsByAssetType = useMemo(() => {
    const groups = new Map<AssetType, typeof positions>()
    for (const p of positions) {
      const type = assetTypeByTicker.get(p.ticker) ?? 'share'
      groups.set(type, [...(groups.get(type) ?? []), p])
    }
    return groups
  }, [positions, assetTypeByTicker])

  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0)
  const filledOrders = filteredOrders.filter((o) => o.status === 'filled')
  const avgTradeSize = filledOrders.length
    ? filledOrders.reduce((sum, o) => sum + o.price * o.size, 0) / filledOrders.length
    : 0

  const exportOrders = () => {
    downloadCsv(
      `terminalfor-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      ['Время', 'Тикер', 'Сторона', 'Тип', 'Цена', 'Объём', 'Статус'],
      filteredOrders.map((o) => [
        format(o.createdAt, 'yyyy-MM-dd HH:mm:ss'),
        o.ticker,
        o.side === 'buy' ? 'Покупка' : 'Продажа',
        o.type,
        o.price,
        o.size,
        STATUS_LABELS[o.status] ?? o.status,
      ])
    )
  }

  const exportPositions = () => {
    downloadCsv(
      `terminalfor-positions-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      ['Тикер', 'Класс актива', 'Сторона', 'Объём', 'Ср. цена', 'Тек. цена', 'P&L', 'P&L %'],
      positions.map((p) => [
        p.ticker,
        ASSET_TYPE_LABELS[assetTypeByTicker.get(p.ticker) ?? 'share'],
        p.side === 'buy' ? 'Long' : 'Short',
        p.size,
        p.avgPrice,
        p.currentPrice,
        p.pnl.toFixed(2),
        p.pnlPercent.toFixed(2),
      ])
    )
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
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
        </div>

        <div className="h-64 shrink-0">
          <Panel
            title="Динамика капитала"
            noPadding
            className="rounded-lg border border-border-color"
            actions={
              <div className="flex items-center gap-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                      period === p.value ? 'bg-accent text-accent-contrast' : 'text-text-secondary hover:bg-bg-hover'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            }
          >
            <EquityChart points={filteredEquityPoints} />
          </Panel>
        </div>

        <Panel
          title={`История заявок · ${filteredOrders.length}`}
          noPadding
          className="rounded-lg border border-border-color"
          actions={
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span>
                Средняя сделка:{' '}
                <span className="font-tabular text-text-secondary">{avgTradeSize ? formatMoney(avgTradeSize) : '—'}</span>
              </span>
              <button
                onClick={exportOrders}
                disabled={filteredOrders.length === 0}
                className="flex items-center gap-1 rounded border border-border-color px-2 py-1 text-text-secondary transition-colors hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <DownloadSimple size={12} /> CSV
              </button>
            </div>
          }
        >
          {filteredOrders.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-xs text-text-muted">
              Заявок за выбранный период не было
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
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="border-b border-border-subtle">
                    <td className="px-3 py-1.5 font-tabular text-text-muted">{format(o.createdAt, 'dd.MM HH:mm:ss')}</td>
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

        <Panel
          title="Структура открытых позиций"
          noPadding
          className="rounded-lg border border-border-color"
          actions={
            <button
              onClick={exportPositions}
              disabled={positions.length === 0}
              className="flex items-center gap-1 rounded border border-border-color px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <DownloadSimple size={12} /> CSV
            </button>
          }
        >
          {positions.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-xs text-text-muted">Открытых позиций нет</div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {[...positionsByAssetType.entries()].map(([type, group]) => {
                const groupPnl = group.reduce((sum, p) => sum + p.pnl, 0)
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between bg-bg-elevated px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                      <span>
                        {ASSET_TYPE_LABELS[type]} · {group.length}
                      </span>
                      <span className={`font-tabular ${groupPnl >= 0 ? 'text-buy' : 'text-sell'}`}>{formatMoney(groupPnl)}</span>
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        {group.map((p) => (
                          <tr key={p.ticker} className="border-b border-border-subtle last:border-b-0">
                            <td className="w-1/5 px-3 py-1.5 font-semibold text-text-primary">{p.ticker}</td>
                            <td className="px-3 py-1.5 text-right font-tabular text-text-secondary">{p.size}</td>
                            <td className="px-3 py-1.5 text-right font-tabular text-text-secondary">{formatPrice(p.avgPrice)}</td>
                            <td className="px-3 py-1.5 text-right font-tabular text-text-secondary">{formatPrice(p.currentPrice)}</td>
                            <td
                              className={`px-3 py-1.5 text-right font-tabular font-semibold ${p.pnl >= 0 ? 'text-buy' : 'text-sell'}`}
                            >
                              {formatMoney(p.pnl)} <span className="opacity-80">({formatPercent(p.pnlPercent)})</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
