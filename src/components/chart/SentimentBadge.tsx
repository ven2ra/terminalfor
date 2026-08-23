import { Minus, TrendDown, TrendUp } from '@phosphor-icons/react'

interface SentimentBadgeProps {
  changePercent: number
}

/** Компактный индикатор настроения по бумаге (Bullish/Neutral/Bearish) со шкалой силы движения */
export function SentimentBadge({ changePercent }: SentimentBadgeProps) {
  const abs = Math.abs(changePercent)
  const neutral = abs < 0.15
  const bullish = !neutral && changePercent > 0

  const label = neutral ? 'Нейтрально' : bullish ? 'Бычий тренд' : 'Медвежий тренд'
  const color = neutral ? 'text-text-secondary' : bullish ? 'text-buy' : 'text-sell'
  const bg = neutral ? 'bg-bg-elevated' : bullish ? 'bg-buy-bg' : 'bg-sell-bg'
  const Icon = neutral ? Minus : bullish ? TrendUp : TrendDown

  // Сила движения — 5 делений, насыщенность растёт с |change%| (условная шкала до 3%)
  const strength = Math.min(5, Math.max(1, Math.round((abs / 3) * 5) || 1))

  return (
    <div className={`flex items-center gap-1.5 rounded-md px-2 py-1 ${bg}`}>
      <Icon size={12} className={color} />
      <span className={`text-[11px] font-semibold ${color}`}>{label}</span>
      <div className="flex items-center gap-[2px]" title={`Сила движения: ${strength}/5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-1 rounded-sm ${i < strength ? color.replace('text-', 'bg-') : 'bg-border-color'}`}
          />
        ))}
      </div>
    </div>
  )
}
