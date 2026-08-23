import { useState } from 'react'

interface InstrumentLogoProps {
  ticker: string
  isin: string | null
  size?: number
  className?: string
}

const AVATAR_COLORS = ['#3b82f6', '#26a65b', '#f5a623', '#a367f5', '#e0473b', '#0ea5e9', '#ec4899', '#14b8a6']

function colorForTicker(ticker: string): string {
  let hash = 0
  for (let i = 0; i < ticker.length; i++) hash = (hash * 31 + ticker.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

/**
 * Логотип компании по ISIN через публичный CDN Т-Инвестиций. Он отдаёт
 * логотип не для каждой бумаги (в основном для акций, не ETF/облигаций) —
 * при ошибке загрузки или отсутствии ISIN показываем аватар с инициалами тикера.
 */
export function InstrumentLogo({ ticker, isin, size = 28, className = '' }: InstrumentLogoProps) {
  const [failed, setFailed] = useState(false)
  const showImage = isin && !failed

  if (!showImage) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-display text-[10px] font-bold text-white ${className}`}
        style={{ width: size, height: size, backgroundColor: colorForTicker(ticker) }}
      >
        {ticker.slice(0, 2)}
      </div>
    )
  }

  return (
    <img
      src={`https://invest-brands.cdn-tinkoff.ru/${isin}x160.png`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full bg-white object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
