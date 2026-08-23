import { Instrument } from '@/types'

/** Список торгуемых инструментов с реалистичными стартовыми котировками */
export const INSTRUMENTS: Instrument[] = [
  { ticker: 'SBER', name: 'Сбербанк', exchange: 'MOEX', currency: 'RUB', lastPrice: 289.45, change: 3.12, changePercent: 1.09, volume: 18_420_300, isFavorite: true },
  { ticker: 'GAZP', name: 'Газпром', exchange: 'MOEX', currency: 'RUB', lastPrice: 138.02, change: -1.44, changePercent: -1.03, volume: 24_110_500 },
  { ticker: 'LKOH', name: 'Лукойл', exchange: 'MOEX', currency: 'RUB', lastPrice: 7218.5, change: 42.5, changePercent: 0.59, volume: 612_400, isFavorite: true },
  { ticker: 'YDEX', name: 'Яндекс', exchange: 'MOEX', currency: 'RUB', lastPrice: 4102.0, change: -18.0, changePercent: -0.44, volume: 890_200 },
  { ticker: 'GMKN', name: 'Норникель', exchange: 'MOEX', currency: 'RUB', lastPrice: 15420.0, change: 120.0, changePercent: 0.78, volume: 245_700 },
  { ticker: 'ROSN', name: 'Роснефть', exchange: 'MOEX', currency: 'RUB', lastPrice: 561.3, change: 4.8, changePercent: 0.86, volume: 3_120_400 },
  { ticker: 'TATN', name: 'Татнефть', exchange: 'MOEX', currency: 'RUB', lastPrice: 712.9, change: -3.6, changePercent: -0.5, volume: 1_450_800 },
  { ticker: 'BTCUSDT', name: 'Bitcoin', exchange: 'CRYPTO', currency: 'USDT', lastPrice: 68420.15, change: 812.4, changePercent: 1.2, volume: 42_300, isFavorite: true },
  { ticker: 'ETHUSDT', name: 'Ethereum', exchange: 'CRYPTO', currency: 'USDT', lastPrice: 3542.8, change: -24.1, changePercent: -0.67, volume: 128_400 },
]

export const DEFAULT_TICKER = 'SBER'
