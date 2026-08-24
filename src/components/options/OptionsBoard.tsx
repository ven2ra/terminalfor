import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { fetchOptionChain } from '@/api/client'
import { useOptionAssets } from '@/hooks/useOptionAssets'
import { Panel } from '@/components/common/Panel'
import { SkeletonRows } from '@/components/common/Skeleton'
import { formatPrice } from '@/lib/format'
import { OptionChain, OptionContract } from '@/types'

interface OptionsBoardProps {
  onRemove?: () => void
}

const POLL_MS = 10000

function Cell({ contract, align }: { contract: OptionContract | null; align: 'left' | 'right' }) {
  if (!contract) return <td className="px-2 py-1.5 text-text-muted">—</td>
  const positive = contract.changePercent >= 0
  return (
    <td className={`px-2 py-1.5 font-tabular ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <div className={contract.lastPrice != null ? (positive ? 'text-buy' : 'text-sell') : 'text-text-muted'}>
        {contract.lastPrice != null ? formatPrice(contract.lastPrice) : '—'}
      </div>
      <div className="text-[10px] text-text-muted">ОИ {contract.openInterest}</div>
    </td>
  )
}

/** Доска опционов FORTS: шахматка call/put по страйкам для одной экспирации базового актива */
export function OptionsBoard({ onRemove }: OptionsBoardProps) {
  const assets = useOptionAssets()
  const [asset, setAsset] = useState('')
  const [expiry, setExpiry] = useState<string | undefined>(undefined)
  const [chain, setChain] = useState<OptionChain | null>(null)

  useEffect(() => {
    if (!asset && assets.length > 0) setAsset(assets[0].code)
  }, [assets, asset])

  useEffect(() => {
    if (!asset) return
    let cancelled = false
    const load = () => {
      fetchOptionChain(asset, expiry)
        .then((data) => {
          if (!cancelled) {
            setChain(data)
            // Ближайшую экспирацию бэкенд подставляет сам — синхронизируем
            // локальный выбор, чтобы вкладка подсветилась правильно
            setExpiry((prev) => prev ?? data.expiry ?? undefined)
          }
        })
        .catch(() => {
          if (!cancelled) setChain(null)
        })
    }
    load()
    const poll = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [asset, expiry])

  return (
    <Panel
      title="Доска опционов"
      noPadding
      draggable={!!onRemove}
      onRemove={onRemove}
      actions={
        <select
          value={asset}
          onChange={(e) => {
            setAsset(e.target.value)
            setExpiry(undefined)
            setChain(null)
          }}
          className="rounded border border-border-color bg-bg-base py-1 pl-2 pr-6 text-xs text-text-primary focus:border-accent focus:outline-none"
        >
          {assets.map((a) => (
            <option key={a.code} value={a.code}>
              {a.name}
            </option>
          ))}
        </select>
      }
    >
      {chain && chain.expiries.length > 0 && (
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border-subtle px-2 py-1.5">
          {chain.expiries.map((exp) => (
            <button
              key={exp}
              onClick={() => setExpiry(exp)}
              className={`shrink-0 whitespace-nowrap rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                chain.expiry === exp ? 'bg-accent text-accent-contrast' : 'text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {format(new Date(`${exp}T00:00:00`), 'd MMM', { locale: ru })}
            </button>
          ))}
        </div>
      )}

      {chain === null ? (
        <div className="p-3">
          <SkeletonRows rows={8} />
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-bg-panel">
              <tr className="border-b border-border-subtle text-text-muted">
                <th className="px-2 py-1.5 text-left font-medium text-buy">Call</th>
                <th className="px-2 py-1.5 text-center font-medium">Страйк</th>
                <th className="px-2 py-1.5 text-right font-medium text-sell">Put</th>
              </tr>
            </thead>
            <tbody>
              {chain.rows.map((row) => (
                <tr key={row.strike} className="border-b border-border-subtle hover:bg-bg-hover">
                  <Cell contract={row.call} align="left" />
                  <td className="px-2 py-1.5 text-center font-tabular font-semibold text-text-primary">
                    {formatPrice(row.strike, 0)}
                  </td>
                  <Cell contract={row.put} align="right" />
                </tr>
              ))}
              {chain.rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-text-muted">
                    Нет данных по этой экспирации
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
