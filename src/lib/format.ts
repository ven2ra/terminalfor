/** Форматирование чисел/валют в стиле профессиональных терминалов */

export function formatPrice(value: number, decimals = 2): string {
  return value.toLocaleString('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  RUB: '₽',
  USD: '$',
  USDT: '$',
  EUR: '€',
  CNY: '¥',
  GBP: '£',
  HKD: 'HK$',
}

export function formatMoney(value: number, currency = 'RUB'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  const sign = value < 0 ? '-' : ''
  return `${sign}${symbol}${Math.abs(value).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatSigned(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatPrice(value, decimals)}`
}
