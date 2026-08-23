import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useMarketStore } from '@/store/useMarketStore'
import { useOrderStore } from '@/store/useOrderStore'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { useOrderDraftStore } from '@/store/useOrderDraftStore'
import { OrderType } from '@/types'
import { Panel } from '@/components/common/Panel'
import { formatMoney } from '@/lib/format'

const ORDER_TYPES: Array<{ value: OrderType; label: string }> = [
  { value: 'market', label: 'Рыночная' },
  { value: 'limit', label: 'Лимитная' },
  { value: 'stop', label: 'Стоп' },
]

const QUICK_VOLUMES = [10, 50, 100, 500]

interface OrderPanelProps {
  onRemove?: () => void
}

/** Панель выставления ордеров: покупка/продажа, тип, объём, цена, быстрые кнопки. Клик по стакану подставляет цену */
export function OrderPanel({ onRemove }: OrderPanelProps) {
  const { instruments, selectedTicker } = useMarketStore()
  const { placeOrder } = useOrderStore()
  const { account } = usePortfolioStore()
  const { draft } = useOrderDraftStore()
  const instrument = instruments.find((i) => i.ticker === selectedTicker)

  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [type, setType] = useState<OrderType>('limit')
  const [price, setPrice] = useState('')
  const [size, setSize] = useState('10')
  const [flash, setFlash] = useState<string | null>(null)

  // При смене инструмента (или первой загрузке его котировки) подставляем цену по умолчанию
  useEffect(() => {
    if (instrument) setPrice(instrument.lastPrice.toFixed(2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicker, instrument === undefined])

  // Клик по строке стакана заявок подставляет цену и сторону сюда
  useEffect(() => {
    if (!draft) return
    setType('limit')
    setSide(draft.side)
    setPrice(draft.price.toFixed(2))
  }, [draft])

  const lastPrice = instrument?.lastPrice ?? 0
  const numericPrice = type === 'market' ? lastPrice : Number(price) || 0
  const numericSize = Number(size) || 0
  const total = numericPrice * numericSize
  const step = instrument?.lotSize ?? 1

  const adjustSize = (delta: number) => {
    const next = Math.max(step, (Number(size) || 0) + delta)
    setSize(String(next))
  }

  const handleSubmit = () => {
    if (!instrument || numericSize <= 0) return
    placeOrder({ ticker: instrument.ticker, side, type, price: numericPrice, size: numericSize })
    setFlash(`Заявка ${side === 'buy' ? 'на покупку' : 'на продажу'} отправлена`)
    setTimeout(() => setFlash(null), 2000)
  }

  return (
    <Panel title="Выставление ордера" draggable={!!onRemove} onRemove={onRemove}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSide('buy')}
            className={`rounded-md py-2 text-sm font-bold transition-colors ${
              side === 'buy' ? 'bg-buy text-white' : 'bg-buy-bg text-buy hover:brightness-110'
            }`}
          >
            Купить
          </button>
          <button
            onClick={() => setSide('sell')}
            className={`rounded-md py-2 text-sm font-bold transition-colors ${
              side === 'sell' ? 'bg-sell text-white' : 'bg-sell-bg text-sell hover:brightness-110'
            }`}
          >
            Продать
          </button>
        </div>

        <div className="flex gap-1 rounded-md bg-bg-elevated p-1">
          {ORDER_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`flex-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                type === t.value ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <label className="block text-xs text-text-muted">
          Цена, {instrument?.currency ?? 'RUB'}
          <input
            disabled={type === 'market'}
            value={type === 'market' ? lastPrice.toFixed(2) : price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-md border border-border-color bg-bg-base px-2.5 py-1.5 font-tabular text-sm text-text-primary focus:border-accent focus:outline-none disabled:opacity-60"
          />
        </label>

        <label className="block text-xs text-text-muted">
          Количество, шт.
          <div className="mt-1 flex items-stretch overflow-hidden rounded-md border border-border-color focus-within:border-accent">
            <button
              type="button"
              onClick={() => adjustSize(-step)}
              aria-label="Уменьшить количество"
              className="flex w-8 shrink-0 items-center justify-center bg-bg-elevated text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              <Minus size={13} />
            </button>
            <input
              value={size}
              onChange={(e) => setSize(e.target.value)}
              inputMode="decimal"
              className="min-w-0 flex-1 bg-bg-base px-2 py-1.5 text-center font-tabular text-sm text-text-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => adjustSize(step)}
              aria-label="Увеличить количество"
              className="flex w-8 shrink-0 items-center justify-center bg-bg-elevated text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
            >
              <Plus size={13} />
            </button>
          </div>
        </label>

        <div className="flex gap-1.5">
          {QUICK_VOLUMES.map((v) => (
            <button
              key={v}
              onClick={() => setSize(String(v))}
              className="flex-1 rounded border border-border-color py-1 text-xs text-text-secondary hover:border-accent hover:text-accent"
            >
              {v}
            </button>
          ))}
        </div>

        <div className="space-y-1 rounded-md bg-bg-elevated px-3 py-2 text-xs">
          <div className="flex justify-between text-text-muted">
            <span>Сумма</span>
            <span className="font-tabular text-text-secondary">{formatMoney(total)}</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Доступно</span>
            <span className="font-tabular text-text-secondary">{formatMoney(account.availableMargin)}</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!instrument}
          className={`rounded-md py-2.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50 ${
            side === 'buy' ? 'bg-buy hover:brightness-110' : 'bg-sell hover:brightness-110'
          }`}
        >
          {side === 'buy' ? 'Купить' : 'Продать'} {instrument?.ticker ?? ''}
        </button>

        {flash && <div className="rounded-md bg-accent/10 px-2.5 py-1.5 text-center text-xs font-medium text-accent">{flash}</div>}
      </div>
    </Panel>
  )
}
