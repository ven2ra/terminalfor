/**
 * Проверка "бумага только для квалифицированных инвесторов" по SECID.
 * У MOEX ISS это не поле в общем списке бумаг доски (там его просто нет),
 * а отдельное поле ISQUALIFIEDINVESTORS в детальном описании конкретной
 * бумаги (/iss/securities/{secid}.json) — один запрос на бумагу, поэтому
 * не тянем это для всего списка разом, а проверяем лениво, по тикеру,
 * когда он реально открыт (график/заявка), и кэшируем надолго: этот
 * признак у бумаги меняется исключительно редко.
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
  }
}

export function getInstrumentFlags(ticker) {
  return cached(`qual-flags:${ticker}`, 24 * 3600000, () => loadFlags(ticker))
}
