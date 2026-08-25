import { useEffect, useRef, useState } from 'react'
import { Percent, Clock } from '@phosphor-icons/react'
import { useKeyRate } from '@/hooks/useKeyRate'
import { usePortfolioStore } from '@/store/usePortfolioStore'
import { formatMoney } from '@/lib/format'

// Надбавка брокера к ключевой ставке ЦБ по необеспеченным (маржинальным) лонгам
const LONG_MARKUP_PERCENT = 6.9
const DAYS_IN_YEAR = 365

/** Кнопка "Маржа" в шапке — по клику показывает ставку по плечу (КС + надбавка) и дневную комиссию по фактическому долгу счёта */
export function MarginInfoButton() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const keyRate = useKeyRate()
  const usedMargin = usePortfolioStore((s) => s.account.usedMargin)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  const totalRate = keyRate ? keyRate.rate + LONG_MARKUP_PERCENT : null
  const dailyCommission = totalRate != null ? (usedMargin * totalRate) / 100 / DAYS_IN_YEAR : null

  return (
    <div ref={containerRef} className="relative hidden shrink-0 lg:block">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Условия маржинального кредитования"
        className={`flex h-full items-center gap-1.5 border border-border-color px-2.5 py-1.5 text-[9px] uppercase tracking-wide transition-colors ${
          open ? 'bg-bg-hover text-text-primary' : 'bg-bg-head text-text-secondary hover:text-text-primary'
        }`}
      >
        <Percent size={12} weight="bold" />
        Маржа {totalRate != null ? `· ${totalRate.toFixed(1)}%` : ''}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-80 border border-border-color bg-bg-elevated p-3 text-xs normal-case shadow-panel">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-text-primary">
            Маржинальное кредитование
          </div>

          <div className="flex items-center justify-between border-b border-border-subtle py-1.5">
            <span className="text-text-muted">Ставка по лонгам</span>
            <span className="font-tabular font-semibold text-text-primary">
              КС + {LONG_MARKUP_PERCENT}% {totalRate != null && `= ${totalRate.toFixed(2)}%`}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-border-subtle py-1.5">
            <span className="text-text-muted">Ключевая ставка ЦБ РФ</span>
            <span className="font-tabular text-text-secondary">
              {keyRate ? `${keyRate.rate}% на ${new Date(keyRate.date).toLocaleDateString('ru-RU')}` : '…'}
            </span>
          </div>

          <p className="mt-2 text-[11px] leading-snug text-text-muted">
            Комиссия списывается ежедневно с непокрытого остатка: сумма долга × ставка ÷ 365.
          </p>

          <div className="mt-2 flex items-start gap-2 border border-warning/30 bg-warning-bg px-2.5 py-2">
            <Clock size={14} weight="bold" className="mt-0.5 shrink-0 text-warning" />
            <p className="text-[11px] leading-snug text-text-primary">
              Пополните счёт до <span className="font-bold">22:30</span> — после этого момента непокрытый остаток уже
              попадёт под комиссию за сегодня.
            </p>
          </div>

          <div className="mt-3 border-t border-border-subtle pt-2">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Используемая маржа</span>
              <span className="font-tabular text-text-secondary">{formatMoney(usedMargin)}</span>
            </div>
            {dailyCommission != null && (
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-text-muted">Комиссия в день</span>
                <span className="font-tabular text-sm font-bold text-sell">{formatMoney(dailyCommission)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
