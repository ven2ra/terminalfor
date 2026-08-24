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

async function postOnce(service, method, body) {
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

// У T-Invest изредка (чаще всего на самых тяжёлых запросах — полный список
// инструментов, это сотни КБ-единицы МБ JSON) рвётся соединение или upstream
// отвечает 503 "upstream connect error" — и то, и другое проходит одним
// ретраем почти всегда; разовый сетевой сбой не должен ронять весь запрос
// и откатывать нас на задержанный ISS до следующего цикла опроса
async function post(service, method, body) {
  const attempts = 3
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await postOnce(service, method, body)
    } catch (err) {
      if (attempt === attempts) throw err
      console.error(`tinvest ${service}.${method} попытка ${attempt} не удалась (${err.message}), повторяю…`)
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt))
    }
  }
}

/** Quotation/MoneyValue из T-Invest API — units (строка) + nano (доля) */
function quotationToNumber(q) {
  if (!q) return null
  return Number(q.units) + (q.nano ?? 0) / 1e9
}

// Тикер у T-Invest совпадает с SECID на MOEX ISS для акций, облигаций и
// "настоящих" месячных фьючерсов (classCode SPBFUT, напр. SRU6 — и там,
// и там). У T-Invest в Futures.instruments вперемешку есть ещё "вечные"/
// weekend-контракты (classCode SPBDMFUT, напр. SBERFperp) — их тикеры не
// совпадают с биржевыми SECID, поэтому берём только SPBFUT
const FIGI_MAP_SOURCES = {
  shares: { method: 'Shares', classCodes: new Set(['TQBR']) },
  bonds: { method: 'Bonds', classCodes: new Set(['TQOB', 'TQCB']) },
  futures: { method: 'Futures', classCodes: new Set(['SPBFUT']) },
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

// Последняя успешно построенная карта на каждый kind — тикер→FIGI меняется
// крайне редко, поэтому при сбое обновления (после ретрая в post() всё
// равно не прошло) отдаём вчерашнюю карту вместо пустой: иначе один неудачный
// запрос раз в час полностью откатывает акции/облигации/фьючерсы на
// задержанный ISS до следующей удачной попытки
const lastGoodFigiMap = new Map()

/** Карта тикер→FIGI меняется крайне редко — кэшируем на час, при сбое обновления держимся за прошлую */
async function getFigiMap(kind) {
  try {
    const map = await cached(`tinvest:figi-map:${kind}`, 3600000, () => loadTickerToFigiMap(kind))
    lastGoodFigiMap.set(kind, map)
    return map
  } catch (err) {
    const stale = lastGoodFigiMap.get(kind)
    if (stale) {
      console.error(`tinvest figi-map(${kind}) refresh error, используем прошлую карту:`, err.message)
      return stale
    }
    throw err
  }
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
export async function getLastTrades(ticker, kind = 'shares') {
  if (!tinvestEnabled()) return []
  const figiMap = await getFigiMap(kind)
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
