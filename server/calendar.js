/**
 * Календарь ближайших событий по облигациям МосБиржи: оферты (пут/колл-даты)
 * и выплаты купонов. Даты дивидендов сюда сознательно не включены — у MOEX
 * ISS они доступны только по платной подписке (`/iss/securities/{secid}/dividends`
 * и `/iss/cci/corp-actions/dividends` отвечают "доступно только подписчикам"
 * даже для анонимного доступа к обычным котировкам), а свободного JSON-API
 * с дивидендным календарём у сторонних источников нет.
 *
 * Купонные выплаты происходят у тысяч облигаций почти каждый день — без
 * фильтра по ликвидности первые же несколько дней горизонта переполняют
 * список сотнями строк по бумагам, которых никто не держит. Поэтому, как и
 * в bonds.js, берём только топ по обороту.
 */
import { cached } from './cache.js'
import { ISS_BASE, fetchJson, rowsToObjects } from './issClient.js'

const BOARDS = ['TQOB', 'TQCB']
const MAX_BONDS = 150
// Горизонт вперёд, за пределами которого событие ещё не "ближайшее" —
// не тащим в календарь купоны, которые нужны только через полгода
const HORIZON_DAYS = 120

async function loadBoard(board) {
  const url =
    `${ISS_BASE}/engines/stock/markets/bonds/boards/${board}/securities.json` +
    `?iss.meta=off&securities.columns=SECID,SHORTNAME,ISIN,MATDATE,OFFERDATE,NEXTCOUPON,COUPONVALUE,FACEVALUE,CURRENCYID` +
    `&marketdata.columns=SECID,VALTODAY`

  const json = await fetchJson(url)
  const securities = rowsToObjects(json.securities)
  const marketdata = new Map(rowsToObjects(json.marketdata).map((r) => [r.SECID, r]))
  return securities.map((s) => ({ ...s, turnover: marketdata.get(s.SECID)?.VALTODAY ?? 0 }))
}

function daysUntil(dateStr, today) {
  const d = new Date(`${dateStr}T00:00:00Z`)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

async function loadCalendar() {
  const perBoard = await Promise.all(BOARDS.map((b) => loadBoard(b).catch(() => [])))
  const all = perBoard.flat().sort((a, b) => (b.turnover ?? 0) - (a.turnover ?? 0))
  const securities = all.slice(0, MAX_BONDS)

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const events = []
  for (const s of securities) {
    // ISS отдаёт рубли под историческим кодом SUR, а не RUB — приводим к
    // обычному ISO-коду, иначе формат суммы на фронтенде не узнает валюту
    const currency = s.CURRENCYID === 'SUR' ? 'RUB' : (s.CURRENCYID ?? 'RUB')
    const base = { ticker: s.SECID, name: s.SHORTNAME, isin: s.ISIN ?? null, currency }

    if (s.OFFERDATE) {
      const days = daysUntil(s.OFFERDATE, today)
      if (days >= 0 && days <= HORIZON_DAYS) {
        events.push({ ...base, type: 'offer', date: s.OFFERDATE, value: null })
      }
    }
    if (s.NEXTCOUPON) {
      const days = daysUntil(s.NEXTCOUPON, today)
      if (days >= 0 && days <= HORIZON_DAYS) {
        events.push({ ...base, type: 'coupon', date: s.NEXTCOUPON, value: s.COUPONVALUE ?? null })
      }
    }
    if (s.MATDATE) {
      const days = daysUntil(s.MATDATE, today)
      if (days >= 0 && days <= HORIZON_DAYS) {
        events.push({ ...base, type: 'maturity', date: s.MATDATE, value: s.FACEVALUE ?? null })
      }
    }
  }

  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  return events
}

// Даты купонов/оферт меняются редко — держим кэш подольше, как и для самих облигаций
export function getCalendar() {
  return cached('calendar', 3600000, loadCalendar)
}
