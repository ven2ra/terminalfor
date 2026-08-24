/**
 * Опционы FORTS (доска ROPD): котировки конкретных контрактов ("Опционы")
 * и опционная доска — шахматка Call/Put по страйкам для одного базового
 * актива и экспирации ("Доска опционов"). Оба виджета read-only — под
 * опционы в приложении нет отдельной модели заявок/маржи, это витрина
 * рынка, а не полноценная торговля опционами.
 */
import { cached } from './cache.js'
import { ISS_BASE, fetchJson, rowsToObjects } from './issClient.js'

const BOARD = 'ROPD'

// Человекочитаемые названия для самых торгуемых базовых активов — у ISS
// это просто код (SBRF, GAZR...), для остальных показываем код как есть,
// его и так знает любой, кто торгует опционами
// Сверено с реальными SHORTNAME контрактов (ASSETCODE сам по себе неоднозначен —
// например MOEX это акция самой биржи, а не индекс, тот отдельно под кодом IMX)
const ASSET_LABELS = {
  SBRF: 'Сбербанк',
  GAZR: 'Газпром',
  LKOH: 'Лукойл',
  ROSN: 'Роснефть',
  GMKN: 'Норникель',
  YDEX: 'Яндекс',
  TATN: 'Татнефть',
  MGNT: 'Магнит',
  NOTK: 'Новатэк',
  PLZL: 'Полюс',
  ALRS: 'Алроса',
  VKCO: 'ВК',
  MOEX: 'МосБиржа',
  IMX: 'Индекс МосБиржи',
  MXI: 'Мини-индекс МосБиржи',
  DIAS: 'Диасофт',
  MTSI: 'МТС',
  TCSI: 'Т-Технологии',
  SVCB: 'Совкомбанк',
  POSI: 'Группа Позитив',
  ASTR: 'Группа Астра',
  Si: 'Доллар/рубль',
  Eu: 'Евро/рубль',
  CNY: 'Юань/рубль',
  GOLD: 'Золото',
  SILV: 'Серебро',
  NG: 'Природный газ',
  BR: 'Нефть Brent',
}

async function loadOptions() {
  const url =
    `${ISS_BASE}/engines/futures/markets/options/boards/${BOARD}/securities.json` +
    `?iss.meta=off&securities.columns=SECID,ASSETCODE,STRIKE,OPTIONTYPE,LASTTRADEDATE,UNDERLYINGASSET,SHORTNAME` +
    `&marketdata.columns=SECID,BID,OFFER,LAST,VOLTODAY,OPENPOSITION,LASTCHANGEPRCNT`

  const json = await fetchJson(url)
  const securities = rowsToObjects(json.securities)
  const marketdata = new Map(rowsToObjects(json.marketdata).map((r) => [r.SECID, r]))

  const today = new Date().toISOString().slice(0, 10)
  const parsed = securities
    .filter((s) => s.LASTTRADEDATE >= today)
    .map((s) => {
      const md = marketdata.get(s.SECID)
      return {
        ticker: s.SECID,
        name: s.SHORTNAME,
        asset: s.ASSETCODE,
        underlyingFuture: s.UNDERLYINGASSET,
        strike: s.STRIKE,
        type: s.OPTIONTYPE === 'C' ? 'call' : 'put',
        expiry: s.LASTTRADEDATE,
        bid: md?.BID || null,
        offer: md?.OFFER || null,
        lastPrice: md?.LAST || null,
        changePercent: md?.LASTCHANGEPRCNT ?? 0,
        volume: md?.VOLTODAY ?? 0,
        openInterest: md?.OPENPOSITION ?? 0,
      }
    })

  return dropSecondaryUnderlyings(parsed)
}

/**
 * У MOEX один и тот же ASSETCODE+экспирация нередко содержит ДВА разных
 * набора контрактов: опционы на саму акцию/индекс (UNDERLYINGASSET — тикер
 * без цифры на конце, например SBER) и опционы на фьючерс на неё
 * (UNDERLYINGASSET — тикер фьючерса вида SRU6/GZU6, буква месяца + цифра
 * года). У них принципиально разная шкала страйков (у SBRF, например,
 * 220–330 против 20000–38000 в тот же день) — без разделения шахматка
 * "Доски опционов" превращалась в кашу из двух несовместимых серий.
 * Оставляем только "прямую" серию (акция/индекс), а если её нет для этой
 * экспирации — самую многочисленную из доступных.
 */
function dropSecondaryUnderlyings(options) {
  const groups = new Map()
  for (const o of options) {
    const key = `${o.asset}:${o.expiry}`
    const byUnderlying = groups.get(key) ?? new Map()
    const list = byUnderlying.get(o.underlyingFuture) ?? []
    list.push(o)
    byUnderlying.set(o.underlyingFuture, list)
    groups.set(key, byUnderlying)
  }

  const result = []
  for (const byUnderlying of groups.values()) {
    if (byUnderlying.size <= 1) {
      result.push(...[...byUnderlying.values()][0])
      continue
    }
    const direct = [...byUnderlying.entries()].filter(([underlying]) => !/\d$/.test(underlying))
    const chosen = direct.length === 1 ? direct[0][1] : [...byUnderlying.values()].sort((a, b) => b.length - a.length)[0]
    result.push(...chosen)
  }
  return result
}

// Опционная доска почти не меняется поминутно (в отличие от акций) —
// экспирации/страйки фиксированы на весь день, котировки обновляются
// не так часто, как у ликвидных акций
function getAllOptions() {
  return cached('options', 20000, loadOptions)
}

export async function getOptionAssets() {
  const options = await getAllOptions()
  const byAsset = new Map()
  for (const o of options) {
    const entry = byAsset.get(o.asset) ?? { code: o.asset, name: ASSET_LABELS[o.asset] ?? o.asset, count: 0 }
    entry.count += 1
    byAsset.set(o.asset, entry)
  }
  return [...byAsset.values()].sort((a, b) => b.count - a.count)
}

export async function getOptionsForAsset(assetCode, expiry) {
  const options = await getAllOptions()
  const forAsset = options.filter((o) => o.asset === assetCode)
  if (!expiry) return forAsset
  return forAsset.filter((o) => o.expiry === expiry)
}

export async function getOptionExpiries(assetCode) {
  const options = await getAllOptions()
  const expiries = [...new Set(options.filter((o) => o.asset === assetCode).map((o) => o.expiry))]
  return expiries.sort()
}

/** Доска опционов: шахматка call/put по страйкам для одной экспирации (ближайшей, если не указана явно) */
export async function getOptionChain(assetCode, requestedExpiry) {
  const expiries = await getOptionExpiries(assetCode)
  const expiry = expiries.includes(requestedExpiry) ? requestedExpiry : expiries[0]
  if (!expiry) return { asset: assetCode, expiry: null, expiries: [], rows: [] }

  const options = await getOptionsForAsset(assetCode, expiry)
  const byStrike = new Map()
  for (const o of options) {
    const row = byStrike.get(o.strike) ?? { strike: o.strike, call: null, put: null }
    row[o.type] = o
    byStrike.set(o.strike, row)
  }
  const rows = [...byStrike.values()].sort((a, b) => a.strike - b.strike)

  return { asset: assetCode, expiry, expiries, rows }
}
