import { useMarketStore } from '@/store/useMarketStore'
import { Panel } from '@/components/common/Panel'
import { formatPrice } from '@/lib/format'
import { isWeekendSessionOpen } from '@/lib/tradingHours'

interface TradesTapeProps {
  onRemove?: () => void
}

/** Лента последних сделок по инструменту (реальные сделки с МосБиржи) */
export function TradesTape({ onRemove }: TradesTapeProps) {
  const { trades } = useMarketStore()
  // По выходным вне сессии выходного дня МосБиржи (09:50–18:59 МСК) у
  // брокера нет внебиржевых торгов (в отличие от Т-Инвестиций) — лента
  // заморожена, показываем это явно
  const sessionOpen = isWeekendSessionOpen()

  return (
    <Panel title="Лента сделок" noPadding draggable={!!onRemove} onRemove={onRemove}>
      <div className="relative flex h-full flex-col text-xs">
        {!sessionOpen && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-bg-panel/90 text-center">
            <span className="font-medium text-text-secondary">Торги закрыты</span>
            <span className="text-[11px] text-text-muted">По выходным лента сделок работает с 09:50 до 18:59 МСК</span>
          </div>
        )}
        <div className="grid shrink-0 grid-cols-3 gap-1 px-3 py-1.5 text-text-muted">
          <span>Время</span>
          <span className="text-right">Цена</span>
          <span className="text-right">Объём</span>
        </div>
        {trades.length === 0 && <div className="p-4 text-center text-text-muted">Нет сделок</div>}
        {trades.map((t) => (
          <div key={t.id} className="grid grid-cols-3 gap-1 px-3 py-[3px] font-tabular animate-flash">
            <span className="text-text-muted">{t.time}</span>
            <span className={`text-right ${t.side === 'buy' ? 'text-buy' : 'text-sell'}`}>{formatPrice(t.price)}</span>
            <span className="text-right text-text-secondary">{t.size}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
