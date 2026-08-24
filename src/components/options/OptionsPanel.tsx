import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { fetchOptionsList } from '@/api/client'
import { useOptionAssets } from '@/hooks/useOptionAssets'
import { Panel } from '@/components/common/Panel'
import { SkeletonRows } from '@/components/common/Skeleton'
import { formatPercent, formatPrice } from '@/lib/format'
import { useMarketStore } from '@/store/useMarketStore'
import { useViewStore } from '@/store/useViewStore'
import { OptionContract } from '@/types'

interface OptionsPanelProps {
  onRemove?: () => void
}

const POLL_MS = 10000
type SideFilter = 'all' | 'call' | 'put'

/** Плоский список опционных контрактов FORTS по выбранному базовому активу — витрина котировок, без размещения заявок */
export function OptionsPanel({ onRemove }: OptionsPanelProps) {
  const assets = useOptionAssets()
  const selectOption = useMarketStore((s) => s.selectOption)
  const setView = useViewStore((s) => s.setView)
  const [asset, setAsset] = useState('')
  const [side, setSide] = useState<SideFilter>('all')
  const [options, setOptions] = useState<OptionContract[] | null>(null)

  const openInTerminal = (contract: OptionContract) => {
    selectOption(contract)
    setView('terminal')
  }

  // Самый ликвидный актив по умолчанию — первый в списке (он отсортирован по числу контрактов на бэкенде)
  useEffect(() => {
    if (!asset && assets.length > 0) setAsset(assets[0].code)
  }, [assets, asset])

  useEffect(() => {
    if (!asset) return
    let cancelled = false
    const load = () => {
      fetchOptionsList(asset)
        .then((data) => {
          if (!cancelled) setOptions(data)
        })
        .catch(() => {
          if (!cancelled) setOptions([])
        })
    }
    load()
    const poll = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [asset])

  const filtered = useMemo(() => {
    if (!options) return []
    const list = side === 'all' ? options : options.filter((o) => o.type === side)
    return [...list].sort((a, b) => (a.expiry === b.expiry ? a.strike - b.strike : a.expiry < b.expiry ? -1 : 1))
  }, [options, side])

  return (
    <Panel
      title="Опционы"
      noPadding
      draggable={!!onRemove}
      onRemove={onRemove}
      actions={
        <select
          value={asset}
          onChange={(e) => {
            setAsset(e.target.value)
            setOptions(null)
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
      <div className="flex shrink-0 gap-1 border-b border-border-subtle px-2 py-1.5">
        {(['all', 'call', 'put'] as SideFilter[]).map((v) => (
          <button
            key={v}
            onClick={() => setSide(v)}
            className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
              side === v ? 'bg-accent text-accent-contrast' : 'text-text-secondary hover:bg-bg-hover'
            }`}
          >
            {v === 'all' ? 'Все' : v === 'call' ? 'Call' : 'Put'}
          </button>
        ))}
      </div>

      {options === null ? (
        <div className="p-3">
          <SkeletonRows rows={8} />
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-bg-panel">
              <tr className="border-b border-border-subtle text-left text-text-muted">
                <th className="px-3 py-1.5 font-medium">Страйк</th>
                <th className="px-3 py-1.5 font-medium">Тип</th>
                <th className="px-3 py-1.5 font-medium">Экспирация</th>
                <th className="px-3 py-1.5 text-right font-medium">Last</th>
                <th className="px-3 py-1.5 text-right font-medium">%</th>
                <th className="px-3 py-1.5 text-right font-medium">ОИ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const positive = o.changePercent >= 0
                return (
                  <tr
                    key={o.ticker}
                    tabIndex={0}
                    role="button"
                    onClick={() => openInTerminal(o)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openInTerminal(o)
                      }
                    }}
                    className="cursor-pointer border-b border-border-subtle outline-none hover:bg-bg-hover focus-visible:bg-bg-hover focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent"
                  >
                    <td className="px-3 py-1.5 font-tabular font-semibold text-text-primary">{formatPrice(o.strike, 0)}</td>
                    <td className={`px-3 py-1.5 font-medium ${o.type === 'call' ? 'text-buy' : 'text-sell'}`}>
                      {o.type === 'call' ? 'Call' : 'Put'}
                    </td>
                    <td className="px-3 py-1.5 text-text-secondary">
                      {format(new Date(`${o.expiry}T00:00:00`), 'd MMM', { locale: ru })}
                    </td>
                    <td className="px-3 py-1.5 text-right font-tabular text-text-primary">
                      {o.lastPrice != null ? formatPrice(o.lastPrice) : '—'}
                    </td>
                    <td className={`px-3 py-1.5 text-right font-tabular ${positive ? 'text-buy' : 'text-sell'}`}>
                      {o.lastPrice != null ? formatPercent(o.changePercent) : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-tabular text-text-secondary">{o.openInterest}</td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-text-muted">
                    Нет контрактов
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
