import { useEffect, useState } from 'react'
import { Minus, Plus } from '@phosphor-icons/react'
import { useMarketStore } from '@/store/useMarketStore'
import { useOrderStore } from '@/store/useOrderStore'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { useOrderDraftStore } from '@/store/useOrderDraftStore'
import { OrderType } from '@/types'
import { Panel } from '@/components/common/Panel'
import { formatMoney, formatPrice } from '@/lib/format'

const ORDER_TYPES: Array<{ value: OrderType; label: string }> = [
  { value: 'market', label: 'Рыночная' },
  { value: 'limit', label: 'Лимитная' },
  { value: 'stop', label: 'Стоп' },
]

const QUICK_PERCENTS = [25, 50, 75, 100]
// Условная комиссия брокера — как у большинства тарифов "Инвестор" (демо-расчёт, не влияет на баланс)
const COMMISSION_RATE = 0.0005

interface OrderPanelProps {
  onRemove?: () => void
}

/** Панель выставления ордеров: покупка/продажа, тип, объём, цена, быстрые кнопки, подтверждение перед отправкой */
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
  const [confirming, setConfirming] = useState(false)

  // При смене инструмента (или первой загрузке его котировки) подставляем цену по умолчанию
  useEffect(() => {
    if (instrument) setPrice(instrument.lastPrice.toFixed(2))
    setConfirming(false)
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
  const commission = total * COMMISSION_RATE
  const estimatedTotal = side === 'buy' ? total + commission : total - commission
  const step = instrument?.lotSize ?? 1
  const priceError = type !== 'market' && price.trim() !== '' && numericPrice <= 0 ? 'Цена должна быть больше нуля' : null
  const sizeError =
    size.trim() === ''
      ? null
      : numericSize <= 0
        ? 'Количество должно быть больше нуля'
        : numericSize % step !== 0
          ? `Кратно лоту: ${step} шт.`
          : null

  const adjustSize = (delta: number) => {
    const next = Math.max(step, (Number(size) || 0) + delta)
    setSize(String(next))
  }

  const applyPercent = (pct: number) => {
    if (numericPrice <= 0) return
    const budget = (account.availableMargin * pct) / 100
    const lots = Math.max(step, Math.floor(budget / numericPrice / step) * step)
    setSize(String(lots))
  }

  const handleConfirm = () => {
    if (!instrument || numericSize <= 0) return
    placeOrder({ ticker: instrument.ticker, side, type, price: numericPrice, size: numericSize })
    setConfirming(false)
    setFlash(`Заявка ${side === 'buy' ? 'на покупку' : 'на продажу'} отправлена`)
    setTimeout(() => setFlash(null), 2000)
  }

  return (
    <Panel title="Выставление ордера" draggable={!!onRemove} onRemove={onRemove}>
      {confirming && instrument ? (
        <div className="flex flex-col gap-3">
          <div className={`rounded-md px-3 py-2 text-center text-sm font-bold text-white ${side === 'buy' ? 'bg-buy' : 'bg-sell'}`}>
            {side === 'buy' ? 'Покупка' : 'Продажа'} {numericSize} × {instrument.ticker}
          </div>
          <div className="space-y-1.5 rounded-md bg-bg-elevated px-3 py-2.5 text-xs">
            <div className="flex justify-between text-text-muted">
              <span>Цена</span>
              <span className="font-tabular text-text-secondary">
                {formatPrice(numericPrice)}
                {instrument.priceUnit === 'percent' ? '%' : ''}
              </span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Сумма</span>
              <span className="font-tabular text-text-secondary">{formatMoney(total)}</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Комиссия</span>
              <span className="font-tabular text-text-secondary">{formatMoney(commission)}</span>
            </div>
            <div className="flex justify-between border-t border-border-subtle pt-1.5 font-semibold text-text-primary">
              <span>Итого {side === 'buy' ? 'к списанию' : 'к зачислению'}</span>
              <span className="font-tabular">{formatMoney(estimatedTotal)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="rounded-md border border-border-color py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover"
            >
              Отмена
            </button>
            <button
              onClick={handleConfirm}
              className={`rounded-md py-2 text-sm font-bold text-white transition-transform active:scale-[0.98] ${
                side === 'buy' ? 'bg-buy hover:brightness-110' : 'bg-sell hover:brightness-110'
              }`}
            >
              Подтвердить
            </button>
          </div>
        </div>
      ) : (
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
              aria-invalid={!!priceError}
              aria-describedby={priceError ? 'order-price-error' : undefined}
              className={`mt-1 w-full rounded-md border bg-bg-base px-2.5 py-1.5 font-tabular text-sm text-text-primary focus:outline-none disabled:opacity-60 ${
                priceError ? 'border-sell focus:border-sell' : 'border-border-color focus:border-accent'
              }`}
            />
            {priceError && (
              <span id="order-price-error" className="mt-1 block text-[11px] font-normal text-sell">
                {priceError}
              </span>
            )}
          </label>

          <label className="block text-xs text-text-muted">
            Количество, шт.
            <div
              className={`mt-1 flex items-stretch overflow-hidden rounded-md border focus-within:border-accent ${
                sizeError ? 'border-sell' : 'border-border-color'
              }`}
            >
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
                aria-invalid={!!sizeError}
                aria-describedby={sizeError ? 'order-size-error' : undefined}
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
            {sizeError && (
              <span id="order-size-error" className="mt-1 block text-[11px] font-normal text-sell">
                {sizeError}
              </span>
            )}
          </label>

          <div className="flex gap-1.5">
            {QUICK_PERCENTS.map((pct) => (
              <button
                key={pct}
                onClick={() => applyPercent(pct)}
                title={`${pct}% от доступного (${formatMoney(account.availableMargin)})`}
                className="flex-1 rounded border border-border-color py-1 text-xs text-text-secondary hover:border-accent hover:text-accent"
              >
                {pct}%
              </button>
            ))}
          </div>

          <div className="space-y-1 rounded-md bg-bg-elevated px-3 py-2 text-xs">
            <div className="flex justify-between text-text-muted">
              <span>Сумма</span>
              <span className="font-tabular text-text-secondary">{formatMoney(total)}</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Комиссия</span>
              <span className="font-tabular text-text-secondary">{formatMoney(commission)}</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Доступно</span>
              <span className="font-tabular text-text-secondary">{formatMoney(account.availableMargin)}</span>
            </div>
          </div>

          <button
            onClick={() => setConfirming(true)}
            disabled={!instrument || numericSize <= 0 || !!priceError || !!sizeError}
            className={`rounded-md py-2.5 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50 ${
              side === 'buy' ? 'bg-buy hover:brightness-110' : 'bg-sell hover:brightness-110'
            }`}
          >
            {side === 'buy' ? 'Купить' : 'Продать'} {instrument?.ticker ?? ''}
          </button>

          {flash && (
            <div className="animate-pop-in rounded-md bg-accent/10 px-2.5 py-1.5 text-center text-xs font-medium text-accent">
              {flash}
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}
