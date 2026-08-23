import { cached } from './cache.js'

const ISS_BASE = 'https://iss.moex.com/iss'
const BOARD = 'TQBR' // основной режим торгов акциями на МосБирже

/** Единый безопасный тикер: только латиница/цифры, защищает from path-инъекций в апстрим-URL */
export function isValidTicker(ticker) {
  return /^[A-Z0-9]{1,12}$/.test(ticker)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Бывают точечные сетевые сбои при большом числе параллельных запросов — один повтор их гасит */
async function fetchJson(url, attempt = 0) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'terminalfor/1.0' } })
    if (!res.ok) throw new Error(`MOEX ISS ${res.status} for ${url}`)
    return await res.json()
  } catch (err) {
    if (attempt >= 1) throw err
    await sleep(300)
    return fetchJson(url, attempt + 1)
  }
}

function rowsToObjects(block) {
  if (!block) return []
  return block.data.map((row) => Object.fromEntries(block.columns.map((col, i) => [col, row[i]])))
}

/** Список всех бумаг основного режима торгов TQBR с текущими котировками */
async function loadSecurities() {
  const url =
    `${ISS_BASE}/engines/stock/markets/shares/boards/${BOARD}/securities.json` +
    `?iss.meta=off&securities.columns=SECID,SHORTNAME,LOTSIZE,ISIN` +
    `&marketdata.columns=SECID,LAST,PREVPRICE,CHANGE,LASTCHANGEPRCNT,VOLTODAY,VALTODAY,BID,OFFER,UPDATETIME`

  const json = await fetchJson(url)
  const securities = rowsToObjects(json.securities)
  const marketdata = new Map(rowsToObjects(json.marketdata).map((r) => [r.SECID, r]))

  const instruments = securities
    .map((s) => {
      const md = marketdata.get(s.SECID)
      const lastPrice = md?.LAST ?? md?.PREVPRICE ?? null
      if (lastPrice == null) return null
      const change = md?.CHANGE ?? 0
      const prevPrice = lastPrice - change
      // LASTCHANGEPRCNT от ISS не всегда актуален вне торговой сессии — считаем сами от CHANGE
      const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0
      return {
        ticker: s.SECID,
        name: s.SHORTNAME,
        isin: s.ISIN ?? null,
        exchange: 'MOEX',
        currency: 'RUB',
        lotSize: s.LOTSIZE ?? 1,
        lastPrice,
        change,
        changePercent,
        volume: md?.VOLTODAY ?? 0,
        turnover: md?.VALTODAY ?? 0,
        bid: md?.BID ?? null,
        offer: md?.OFFER ?? null,
        updatedAt: md?.UPDATETIME ?? null,
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b.turnover ?? 0) - (a.turnover ?? 0))

  return instruments
}

export function getSecurities() {
  return cached('securities', 1200, loadSecurities)
}

const INTERVALS = new Set([1, 10, 60, 24, 7, 31])
// Коды интервалов MOEX ISS не числовые по величине минут: 1/10/60 — реально
// минуты, а 24/7/31 — это "код" дня/недели/месяца, а не "24 минуты" и т.п.
const MINUTE_INTERVALS = new Set([1, 10, 60])
const PAGE_SIZE = 500

/**
 * Интрадей — глубина/лимит страниц под "последние торговые сессии" (нужно
 * только перекрыть выходные), дневные/недельные/месячные — под всю историю
 * бумаги с торгов (MOEX ISS не отдаёт данные раньше конца 2000-х).
 */
function candleWindow(interval) {
  const intraday = MINUTE_INTERVALS.has(interval)
  return {
    intraday,
    fromYearsBack: intraday ? 0 : 30,
    fromDaysBack: intraday ? 5 : 0, // с запасом на длинные выходные/праздники
    keepLast: intraday ? 500 : 8000,
  }
}

const BATCH_SIZE = 8 // страниц за один параллельный залп
const MAX_BATCHES = 6 // 6×8×500 = 24000 строк — с большим запасом на любой реальный диапазон

/**
 * Свечи по бумаге. MOEX ISS отдаёт не больше 500 строк за запрос, считая от
 * начала запрошенного диапазона — при широком окне (год-десятилетия для
 * дневных, либо просто чтобы перекрыть выходные/вечернюю сессию для интрадей)
 * это утыкается в самое старое, а не в актуальное. Поэтому досылаем страницы
 * через `start=` батчами по несколько параллельных запросов, пока очередной
 * батч не вернёт страницу короче полной (это и есть конец доступных данных) —
 * так не нужно заранее угадывать, сколько страниц реально понадобится.
 */
async function loadCandles(ticker, interval) {
  const { fromYearsBack, fromDaysBack, keepLast } = candleWindow(interval)
  const till = new Date()
  const from = new Date(till)
  from.setUTCFullYear(from.getUTCFullYear() - fromYearsBack)
  from.setUTCDate(from.getUTCDate() - fromDaysBack)
  const fmt = (d) => d.toISOString().slice(0, 10)

  const baseUrl =
    `${ISS_BASE}/engines/stock/markets/shares/boards/${BOARD}/securities/${ticker}/candles.json` +
    `?interval=${interval}&from=${fmt(from)}&till=${fmt(till)}&iss.meta=off`

  const rows = []
  let page = 0
  for (let batchNum = 0; batchNum < MAX_BATCHES; batchNum++) {
    const batchPages = await Promise.allSettled(
      Array.from({ length: BATCH_SIZE }, (_, i) => fetchJson(`${baseUrl}&start=${(page + i) * PAGE_SIZE}`))
    )
    page += BATCH_SIZE

    let reachedEnd = false
    for (const p of batchPages) {
      if (p.status !== 'fulfilled') continue // страница не задалась даже с ретраем — пропускаем, будет небольшой пробел
      const pageRows = rowsToObjects(p.value.candles)
      rows.push(...pageRows)
      if (pageRows.length < PAGE_SIZE) reachedEnd = true
    }
    if (reachedEnd) break
  }

  // Время МосБиржи в ISS приходит в MSK (UTC+3) без указания зоны
  return rows.slice(-keepLast).map((r) => ({
    time: Math.floor(new Date(`${r.begin.replace(' ', 'T')}+03:00`).getTime() / 1000),
    open: r.open,
    high: r.high,
    low: r.low,
    close: r.close,
    volume: r.volume,
  }))
}

export function getCandles(ticker, interval) {
  if (!isValidTicker(ticker)) throw new Error('invalid ticker')
  if (!INTERVALS.has(interval)) throw new Error('invalid interval')
  // Дневные+ бары не нужно перепроверять каждые несколько секунд — там
  // меняется максимум текущий незакрытый бар, а сам запрос тяжёлый (до 16
  // страниц на всю историю)
  const ttl = MINUTE_INTERVALS.has(interval) ? 8000 : 60000
  return cached(`candles:${ticker}:${interval}`, ttl, () => loadCandles(ticker, interval))
}

/** Лента последних сделок по бумаге */
async function loadTrades(ticker) {
  const url = `${ISS_BASE}/engines/stock/markets/shares/securities/${ticker}/trades.json?iss.meta=off&trades.columns=TRADENO,TRADETIME,PRICE,QUANTITY,BUYSELL`
  const json = await fetchJson(url)
  const rows = rowsToObjects(json.trades)
  return rows
    .slice(-60)
    .reverse()
    .map((r) => ({
      id: String(r.TRADENO),
      price: r.PRICE,
      size: r.QUANTITY,
      side: r.BUYSELL === 'B' ? 'buy' : 'sell',
      time: r.TRADETIME,
    }))
}

export function getTrades(ticker) {
  if (!isValidTicker(ticker)) throw new Error('invalid ticker')
  return cached(`trades:${ticker}`, 1200, () => loadTrades(ticker))
}
