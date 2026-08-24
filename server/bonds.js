/**
 * Облигации МосБиржи: гособлигации (TQOB) + корпоративные (TQCB). Корпоративных
 * несколько тысяч, подавляющее большинство неликвидны — берём топ по обороту,
 * как и с акциями, иначе список не пролистать и в нём не найти ничего полезного.
 * Цена облигации в LAST/PREVPRICE — это % от номинала (FACEVALUE), не рубли,
 * это общепринятый способ котирования облигаций, оставляем как есть.
 */
import { cached } from './cache.js'
import { ISS_BASE, fetchJson, rowsToObjects } from './issClient.js'
import { registerInstrument } from './instrumentRegistry.js'

const BOARDS = ['TQOB', 'TQCB']
const MAX_BONDS = 150

async function loadBoard(board) {
  const url =
    `${ISS_BASE}/engines/stock/markets/bonds/boards/${board}/securities.json` +
    `?iss.meta=off&securities.columns=SECID,SHORTNAME,LOTSIZE,ISIN,PREVPRICE,FACEVALUE,MATDATE,COUPONPERCENT,CURRENCYID` +
    `&marketdata.columns=SECID,LAST,VOLTODAY,VALTODAY,BID,OFFER,HIGH,LOW,OPEN,UPDATETIME`

  const json = await fetchJson(url)
  const securities = rowsToObjects(json.securities)
  const marketdata = new Map(rowsToObjects(json.marketdata).map((r) => [r.SECID, r]))

  return securities
    .map((s) => {
      const md = marketdata.get(s.SECID)
      const lastPrice = md?.LAST ?? s.PREVPRICE ?? null
      if (lastPrice == null) return null
      const prevPrice = s.PREVPRICE ?? lastPrice
      const change = lastPrice - prevPrice
      const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0
      return {
        ticker: s.SECID,
        name: s.SHORTNAME,
        isin: s.ISIN ?? null,
        exchange: 'MOEX',
        // ISS отдаёт рубли под историческим кодом SUR, а не RUB
        currency: s.CURRENCYID === 'SUR' ? 'RUB' : (s.CURRENCYID ?? 'RUB'),
        assetType: 'bond',
        priceUnit: 'percent', // цена — % от номинала, не абсолютная валюта
        faceValue: s.FACEVALUE ?? null,
        lotSize: s.LOTSIZE ?? 1,
        lastPrice,
        change,
        changePercent,
        volume: md?.VOLTODAY ?? 0,
        turnover: md?.VALTODAY ?? 0,
        bid: md?.BID ?? null,
        offer: md?.OFFER ?? null,
        dayHigh: md?.HIGH ?? null,
        dayLow: md?.LOW ?? null,
        dayOpen: md?.OPEN ?? null,
        updatedAt: md?.UPDATETIME ?? null,
        board,
      }
    })
    .filter(Boolean)
}

async function loadBonds() {
  const perBoard = await Promise.all(BOARDS.map((b) => loadBoard(b).catch(() => [])))
  const all = perBoard.flat().sort((a, b) => (b.turnover ?? 0) - (a.turnover ?? 0))
  const top = all.slice(0, MAX_BONDS)

  for (const bond of top) {
    registerInstrument(bond.ticker, { engine: 'stock', market: 'bonds', board: bond.board, assetType: 'bond' })
  }

  return top.map(({ board, ...rest }) => rest)
}

// TQCB (корпоративные облигации) — это 3000+ бумаг, сам запрос к ISS занимает
// секунды; держим кэш подольше, чтобы не тянуть его на каждый опрос вотчлиста
export function getBonds() {
  return cached('bonds', 30000, loadBonds)
}
