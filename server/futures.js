/**
 * Фьючерсы FORTS (МосБиржа деривативы). Board RFUD — 400-500 контрактов,
 * включая дальние/неликвидные месяцы почти по всем базовым активам — берём
 * только неистёкшие (LASTTRADEDATE ещё не прошла) и с реальным оборотом,
 * топ по обороту, чтобы список был обозримым и полезным.
 */
import { cached } from './cache.js'
import { ISS_BASE, fetchJson, rowsToObjects } from './issClient.js'
import { registerInstrument } from './instrumentRegistry.js'

const BOARD = 'RFUD'
const MAX_FUTURES = 100

async function loadFutures() {
  const url =
    `${ISS_BASE}/engines/futures/markets/forts/boards/${BOARD}/securities.json` +
    `?iss.meta=off&securities.columns=SECID,SHORTNAME,ASSETCODE,LASTTRADEDATE,PREVSETTLEPRICE,LOTVOLUME` +
    `&marketdata.columns=SECID,LAST,VOLTODAY,VALTODAY,HIGH,LOW,BID,OFFER,UPDATETIME`

  const json = await fetchJson(url)
  const securities = rowsToObjects(json.securities)
  const marketdata = new Map(rowsToObjects(json.marketdata).map((r) => [r.SECID, r]))
  const today = new Date().toISOString().slice(0, 10)

  const all = securities
    .map((s) => {
      if (s.LASTTRADEDATE < today) return null // экспирировавший контракт
      const md = marketdata.get(s.SECID)
      const lastPrice = md?.LAST ?? s.PREVSETTLEPRICE ?? null
      if (lastPrice == null) return null
      const prevPrice = s.PREVSETTLEPRICE ?? lastPrice
      const change = lastPrice - prevPrice
      const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0
      return {
        ticker: s.SECID,
        name: s.SHORTNAME,
        isin: null,
        exchange: 'MOEX',
        currency: 'RUB',
        assetType: 'future',
        priceUnit: 'currency',
        lotSize: s.LOTVOLUME ?? 1,
        lastPrice,
        change,
        changePercent,
        volume: md?.VOLTODAY ?? 0,
        turnover: md?.VALTODAY ?? 0,
        bid: md?.BID ?? null,
        offer: md?.OFFER ?? null,
        dayHigh: md?.HIGH ?? null,
        dayLow: md?.LOW ?? null,
        updatedAt: md?.UPDATETIME ?? null,
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b.turnover ?? 0) - (a.turnover ?? 0))

  const top = all.slice(0, MAX_FUTURES)
  for (const f of top) {
    registerInstrument(f.ticker, { engine: 'futures', market: 'forts', board: BOARD, assetType: 'future' })
  }
  return top
}

export function getFutures() {
  return cached('futures', 15000, loadFutures)
}
