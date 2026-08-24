/**
 * Клиент T-Invest API (REST-шлюз) — источник рыночных данных БЕЗ 15-минутной
 * задержки MOEX ISS (та отдаёт анонимному доступу delayed-котировки, это
 * политика биржи, не наш баг). Работает только при заданном TINVEST_TOKEN —
 * без него весь модуль просто не используется, приложение остаётся на ISS.
 *
 * Токен создаётся в Т-Инвестициях: Настройки → API → «Только просмотр»
 * достаточно, торговых поручений мы не отправляем.
 */
import { cached } from './cache.js'

const BASE = 'https://invest-public-api.tinkoff.ru/rest/tinkoff.public.invest.api.contract.v1'
const TOKEN = process.env.TINVEST_TOKEN

export function tinvestEnabled() {
  return Boolean(TOKEN)
}

async function post(service, method, body) {
  const res = await fetch(`${BASE}.${service}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`T-Invest ${service}.${method} ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

/** Quotation/MoneyValue из T-Invest API — units (строка) + nano (доля) */
function quotationToNumber(q) {
  if (!q) return null
  return Number(q.units) + (q.nano ?? 0) / 1e9
}

// Тикер у T-Invest совпадает с SECID на MOEX ISS для акций и облигаций (тот
// же код доски биржи, classCode). У фьючерсов — нет: T-Invest использует
// свой "синтетический" тикер (напр. SBERF с lastTradeDate 2099-12-31),
// а не биржевой SECID месячного контракта (SRU6 и т.п.) — прямое
// сопоставление по тикеру для фьючерсов даст неверные FIGI, поэтому
// фьючерсы здесь не подключены вообще, только акции и облигации
const FIGI_MAP_SOURCES = {
  shares: { method: 'Shares', classCodes: new Set(['TQBR']) },
  bonds: { method: 'Bonds', classCodes: new Set(['TQOB', 'TQCB']) },
}

async function loadTickerToFigiMap(kind) {
  const { method, classCodes } = FIGI_MAP_SOURCES[kind]
  const json = await post('InstrumentsService', method, { instrumentStatus: 'INSTRUMENT_STATUS_BASE' })
  const map = new Map()
  for (const s of json.instruments ?? []) {
    if (classCodes.has(s.classCode) && !map.has(s.ticker)) map.set(s.ticker, s.figi)
  }
  return map
}

/** Карта тикер→FIGI меняется крайне редко — кэшируем на час */
function getFigiMap(kind) {
  return cached(`tinvest:figi-map:${kind}`, 3600000, () => loadTickerToFigiMap(kind))
}

/**
 * Актуальные (без задержки) последние цены по списку тикеров.
 * Возвращает Map<ticker, { price, time }>; тикеры без FIGI/данных просто отсутствуют в ответе.
 */
export async function getLastPrices(tickers, kind = 'shares') {
  if (!tinvestEnabled() || tickers.length === 0) return new Map()
  const figiMap = await getFigiMap(kind)
  const figiToTicker = new Map()
  const figis = []
  for (const t of tickers) {
    const figi = figiMap.get(t)
    if (figi) {
      figiToTicker.set(figi, t)
      figis.push(figi)
    }
  }
  if (figis.length === 0) return new Map()

  const json = await post('MarketDataService', 'GetLastPrices', { figi: figis })
  const result = new Map()
  for (const p of json.lastPrices ?? []) {
    const ticker = figiToTicker.get(p.figi)
    const price = quotationToNumber(p.price)
    if (ticker && price != null) result.set(ticker, { price, time: p.time })
  }
  return result
}

/**
 * Официальная цена закрытия предыдущей торговой сессии ПО ВЕРСИИ T-Invest.
 * Нужна отдельно от ISS: по выходным у Т-Инвестиций идёт сессия выходного
 * дня (внебиржевые OTC-торги), которой у MOEX вообще нет — поэтому их
 * "закрытие предыдущего дня" может быть ценой субботней OTC-сессии, а не
 * пятничным официальным закрытием биржи (PREVLEGALCLOSEPRICE из ISS). Если
 * считать дневной % от биржевого закрытия, он не совпадёт с тем, что
 * показывают брокерские приложения по выходным.
 */
export async function getClosePrices(tickers, kind = 'shares') {
  if (!tinvestEnabled() || tickers.length === 0) return new Map()
  const figiMap = await getFigiMap(kind)
  const figiToTicker = new Map()
  const instruments = []
  for (const t of tickers) {
    const figi = figiMap.get(t)
    if (figi) {
      figiToTicker.set(figi, t)
      instruments.push({ instrumentId: figi })
    }
  }
  if (instruments.length === 0) return new Map()

  const json = await post('MarketDataService', 'GetClosePrices', { instruments })
  const result = new Map()
  for (const c of json.closePrices ?? []) {
    const ticker = figiToTicker.get(c.figi)
    const price = quotationToNumber(c.price)
    if (ticker && price != null) result.set(ticker, price)
  }
  return result
}

/**
 * Реальная (без задержки) лента последних сделок по одной бумаге.
 * Возвращает [] если T-Invest не сконфигурирован, бумага не найдена в
 * карте FIGI или сделок за окно не было — вызывающий код в этом случае
 * должен сам упасть обратно на ISS.
 */
export async function getLastTrades(ticker) {
  if (!tinvestEnabled()) return []
  const figiMap = await getFigiMap('shares')
  const figi = figiMap.get(ticker)
  if (!figi) return []

  const to = new Date()
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000) // с запасом на паузы в торгах
  const json = await post('MarketDataService', 'GetLastTrades', {
    instrumentId: figi,
    from: from.toISOString(),
    to: to.toISOString(),
  })
  const trades = json.trades ?? []
  return trades
    .slice(-60)
    .reverse()
    .map((t, i) => ({
      id: t.time ? `${t.time}-${i}` : String(i),
      price: quotationToNumber(t.price),
      size: Number(t.quantity ?? 0),
      side: t.direction === 'TRADE_DIRECTION_BUY' ? 'buy' : 'sell',
      // Формат "ЧЧ:ММ:СС" МСК — как отдаёт ISS TRADETIME, чтобы фронтенд
      // не менялся в зависимости от источника данных
      time: t.time ? new Date(t.time).toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow', hour12: false }) : '',
    }))
    .filter((t) => t.price != null)
}
