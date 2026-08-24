import { useState } from 'react'

interface InstrumentLogoProps {
  ticker: string
  isin: string | null
  size?: number
  className?: string
  /** Гособлигация (ОФЗ) — показываем герб Минфина вместо поиска логотипа по ISIN */
  isOfz?: boolean
}

const AVATAR_COLORS = ['#3b82f6', '#10b981', '#fbbf24', '#a367f5', '#f87171', '#0ea5e9', '#ec4899', '#14b8a6']

function colorForTicker(ticker: string): string {
  let hash = 0
  for (let i = 0; i < ticker.length; i++) hash = (hash * 31 + ticker.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

/**
 * Логотип компании по ISIN — запрашивается через собственный бэкенд
 * (/api/logo/:isin), а не напрямую с внешнего CDN: так же, как и все
 * остальные данные приложения. Бэкенд сам решает, откуда брать картинку,
 * кэширует результат и не заставляет браузер каждого пользователя ходить
 * на сторонний хост напрямую (там, где это могло не работать из-за
 * прокси/файрвола — единственное место в проекте с таким запросом).
 * Полного покрытия всё равно нет (не для каждой бумаги, особенно ETF и
 * недавно переименованных тикеров, есть логотип) — при ошибке или
 * отсутствии ISIN показываем аватар с инициалами тикера.
 */
export function InstrumentLogo({ ticker, isin, size = 28, className = '', isOfz }: InstrumentLogoProps) {
  // Храним ISIN, для которого загрузка провалилась — а не просто boolean,
  // иначе при смене инструмента в ДОЛГОЖИВУЩЕМ экземпляре компонента (график,
  // где он не пересоздаётся при переключении тикера) состояние ошибки
  // "залипало" навсегда, даже когда у нового ISIN логотип на самом деле есть.
  const [failedIsin, setFailedIsin] = useState<string | null>(null)
  const showImage = isin && isin !== failedIsin

  if (isOfz) {
    return (
      <img
        src="/logos/minfin.svg"
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  if (!showImage) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-display text-[11px] font-bold text-white ${className}`}
        style={{ width: size, height: size, backgroundColor: colorForTicker(ticker) }}
      >
        {ticker.slice(0, 2)}
      </div>
    )
  }

  return (
    <img
      key={isin}
      src={`/api/logo/${isin}`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailedIsin(isin)}
      className={`shrink-0 rounded-full bg-white object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
