/**
 * Бегущая строка: котировки инструментов вне обычного списка акций TQBR —
 * валюты, индекс МосБиржи, товарные фьючерсы (нефть). Акции берём из уже
 * закэшированного списка securities (moex.js), остальное — отдельные,
 * узкоспециализированные запросы к соответствующим рынкам ISS.
 */
import { cached } from './cache.js'
import { ISS_BASE, fetchJson, rowsToObjects } from './issClient.js'
import { getSecurities } from './moex.js'

/**
 * Курс валюты с рынка FX (CETS). Часть пар (напр. EUR/RUB) торгуется тонко
 * или не торгуется вовсе — тогда LAST/CHANGE пустые, используем справочный
 * MARKETPRICE и цену закрытия из securities как базу для сравнения.
 */
async function loadCurrency(secid) {
  const json = await fetchJson(`${ISS_BASE}/engines/currency/markets/selt/boards/CETS/securities/${secid}.json?iss.meta=off`)
  const sec = rowsToObjects(json.securities)[0]
  const md = rowsToObjects(json.marketdata)[0]
  const lastPrice = md?.LAST ?? md?.MARKETPRICE ?? md?.CLOSEPRICE ?? sec?.PREVPRICE
  if (lastPrice == null) return null
  const prevPrice = sec?.PREVPRICE ?? lastPrice - (md?.CHANGE ?? 0)
  const change = lastPrice - prevPrice
  return {
    lastPrice,
    change,
    changePercent: prevPrice !== 0 ? (change / prevPrice) * 100 : 0,
  }
}

/** Значение биржевого индекса (напр. IMOEX) */
async function loadIndex(secid) {
  const json = await fetchJson(`${ISS_BASE}/engines/stock/markets/index/securities/${secid}.json?iss.meta=off`)
  const md = rowsToObjects(json.marketdata)[0]
  if (!md?.CURRENTVALUE) return null
  return {
    lastPrice: md.CURRENTVALUE,
    change: md.LASTCHANGE ?? 0,
    changePercent: md.LASTCHANGEPRC ?? 0,
  }
}

/** Ближайший по сроку экспирации фьючерс на актив (напр. BR — нефть Brent) на FORTS */
async function loadFrontFuture(assetCode) {
  const json = await fetchJson(
    `${ISS_BASE}/engines/futures/markets/forts/securities.json?iss.meta=off` +
      `&securities.columns=SECID,ASSETCODE,LASTTRADEDATE&marketdata.columns=SECID,LAST`
  )
  const securities = rowsToObjects(json.securities)
  const marketdata = new Map(rowsToObjects(json.marketdata).map((r) => [r.SECID, r]))
  const today = new Date().toISOString().slice(0, 10)

  const candidates = securities
    .filter((s) => s.ASSETCODE === assetCode && s.LASTTRADEDATE >= today && marketdata.get(s.SECID)?.LAST != null)
    .sort((a, b) => a.LASTTRADEDATE.localeCompare(b.LASTTRADEDATE))
  const front = candidates[0]
  if (!front) return null

  const secid = front.SECID
  const detail = await fetchJson(`${ISS_BASE}/engines/futures/markets/forts/securities/${secid}.json?iss.meta=off`)
  const sec = rowsToObjects(detail.securities)[0]
  const md = rowsToObjects(detail.marketdata)[0]
  const lastPrice = md?.LAST ?? sec?.PREVSETTLEPRICE
  if (lastPrice == null) return null
  const prevPrice = sec?.PREVSETTLEPRICE ?? lastPrice
  const change = lastPrice - prevPrice
  return {
    lastPrice,
    change,
    changePercent: prevPrice !== 0 ? (change / prevPrice) * 100 : 0,
    label: sec?.SHORTNAME ?? secid,
  }
}

/** Каталог поддерживаемых небиржевых символов бегущей строки (всё, что не акция TQBR) */
const CATALOG = {
  USD: { name: 'Доллар США', load: () => loadCurrency('USD000UTSTOM') },
  EUR: { name: 'Евро', load: () => loadCurrency('EUR_RUB__TOM') },
  CNY: { name: 'Юань', load: () => loadCurrency('CNYRUB_TOM') },
  IMOEX: { name: 'Индекс МосБиржи', load: () => loadIndex('IMOEX') },
  RTSI: { name: 'Индекс РТС', load: () => loadIndex('RTSI') },
  BR: { name: 'Нефть Brent', load: () => loadFrontFuture('BR') },
}

export function getTapeCatalog() {
  return Object.entries(CATALOG).map(([symbol, { name }]) => ({ symbol, name }))
}

async function loadTapeQuote(symbol) {
  const entry = CATALOG[symbol]
  if (entry) {
    const { label, ...data } = (await entry.load()) ?? {}
    if (data.lastPrice == null) return null
    return { symbol, name: label ?? entry.name, ...data }
  }
  // Не в каталоге — считаем тикером акции TQBR, ищем в уже закэшированном списке
  const securities = await getSecurities()
  const s = securities.find((i) => i.ticker === symbol)
  if (!s) return null
  return { symbol, name: s.name, lastPrice: s.lastPrice, change: s.change, changePercent: s.changePercent }
}

export async function getTapeQuotes(symbols) {
  const unique = [...new Set(symbols)].slice(0, 20) // с запасом, но без злоупотреблений
  const results = await Promise.allSettled(
    unique.map((symbol) => cached(`tape:${symbol}`, 3000, () => loadTapeQuote(symbol)))
  )
  return unique
    .map((symbol, i) => (results[i].status === 'fulfilled' ? results[i].value : null))
    .filter(Boolean)
}
