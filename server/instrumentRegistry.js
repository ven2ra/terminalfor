/**
 * Реестр "тикер → где он торгуется" (engine/market/board на MOEX ISS).
 * Акции/фонды, облигации и фьючерсы живут на разных рынках с разным URL-
 * путём для свечей/сделок — этот реестр позволяет getCandles/getTrades
 * в moex.js обращаться к правильному рынку для любого тикера, не считая
 * по умолчанию, что всё — акции на TQBR.
 */
const registry = new Map()

export function registerInstrument(ticker, meta) {
  registry.set(ticker, meta)
}

const DEFAULT_META = { engine: 'stock', market: 'shares', board: 'TQBR', assetType: 'share' }

export function getInstrumentMeta(ticker) {
  return registry.get(ticker) ?? DEFAULT_META
}
