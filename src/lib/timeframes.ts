import { CandleInterval } from '@/api/client'

/** Таймфреймы графика, сопоставленные с кодами интервалов MOEX ISS */
export const TIMEFRAMES: Array<{ label: string; interval: CandleInterval }> = [
  { label: '1м', interval: 1 },
  { label: '10м', interval: 10 },
  { label: '1ч', interval: 60 },
  { label: '1д', interval: 24 },
  { label: '1н', interval: 7 },
]
