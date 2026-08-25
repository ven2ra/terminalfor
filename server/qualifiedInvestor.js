/**
 * Признаки бумаги, которых нет в общем списке доски (securities.json), а
 * только в детальном описании конкретной бумаги (/iss/securities/{secid}.json,
 * один запрос на бумагу) — "квал.инвестор", ПИР и дефолт/техдефолт эмитента.
 * Официальный бесплатный источник дефолтов у MOEX — та же информация, что и
 * на https://www.moex.com/s28, просто структурированным полем в ISS вместо
 * HTML-таблицы. Не тянем это для всего списка бумаг разом (дорого), а
 * проверяем лениво, по тикеру, когда он реально открыт, и кэшируем надолго —
 * эти признаки у бумаги меняются исключительно редко.
 */
import { cached } from './cache.js'
import { ISS_BASE, fetchJson, rowsToObjects } from './issClient.js'

async function loadFlags(ticker) {
  const json = await fetchJson(`${ISS_BASE}/securities/${ticker}.json?iss.meta=off`)
  const rows = rowsToObjects(json.description)
  const byName = new Map(rows.map((r) => [r.name, r.value]))
  return {
    // '1'/'0' строкой у ISS для type: boolean — приводим к настоящему boolean
    isQualifiedOnly: byName.get('ISQUALIFIEDINVESTORS') === '1',
    // Сектор компаний повышенного инвестиционного риска (ПИР) — отдельный
    // от квал-статуса риск-флаг, но по духу та же "прочти перед покупкой"
    // история, показываем рядом
    highRisk: byName.get('HIGHRISK') === '1',
    // ВАЖНО: оба следующих поля у ISS исторические ("БылДефолт"/
    // "БылТехническийДефолт") — означают "когда-либо случалось", а не
    // "сейчас не платят". Флаг не сбрасывается после устранения просрочки,
    // поэтому может стоять и у давно погашенного эпизода на новом выпуске
    // того же эмитента. moex.com/s28 не таблица бумаг, а регламент
    // процедуры — независимого свежего списка "кто сейчас в дефолте"
    // у MOEX бесплатно нет, поэтому трактуем это поле только как
    // "в истории эмитента был дефолт/техдефолт", без утверждения "сейчас"
    hasDefault: byName.get('HASDEFAULT') === '1',
    hasTechnicalDefault: byName.get('HASTECHNICALDEFAULT') === '1',
  }
}

export function getInstrumentFlags(ticker) {
  return cached(`qual-flags:${ticker}`, 24 * 3600000, () => loadFlags(ticker))
}
