import { format } from 'date-fns'
import { useMarketStore } from '@/store/useMarketStore'
import { Panel } from '@/components/common/Panel'
import { formatPrice } from '@/lib/format'

/** Лента последних сделок по инструменту */
export function TradesTape() {
  const { trades } = useMarketStore()

  return (
    <Panel title="Лента сделок" noPadding>
      <div className="flex flex-col text-xs">
        <div className="grid shrink-0 grid-cols-3 gap-1 px-3 py-1.5 text-text-muted">
          <span>Время</span>
          <span className="text-right">Цена</span>
          <span className="text-right">Объём</span>
        </div>
        {trades.map((t) => (
          <div key={t.id} className="grid grid-cols-3 gap-1 px-3 py-[3px] font-tabular animate-flash">
            <span className="text-text-muted">{format(t.time, 'HH:mm:ss')}</span>
            <span className={`text-right ${t.side === 'buy' ? 'text-buy' : 'text-sell'}`}>{formatPrice(t.price)}</span>
            <span className="text-right text-text-secondary">{t.size}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
