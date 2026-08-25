/**
 * Ключевая ставка ЦБ РФ — официальный бесплатный SOAP-сервис Банка России
 * (используется многими российскими финансовыми сервисами, JSON-эндпоинта
 * у ЦБ для неё нет). Нужна для маржинальной комиссии по лонгам: КС + 6.9%.
 * Ставка меняется только на заседаниях Совета директоров ЦБ (раз в
 * 6-7 недель), поэтому кэшируем надолго.
 */
import { XMLParser } from 'fast-xml-parser'
import { cached } from './cache.js'

const parser = new XMLParser({ ignoreAttributes: false })

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

async function loadKeyRate() {
  const to = new Date()
  const from = new Date(to.getTime() - 30 * 24 * 3600000) // запас на длинные праздники без обновления ленты

  const body = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <KeyRate xmlns="http://web.cbr.ru/">
      <fromDate>${isoDate(from)}</fromDate>
      <ToDate>${isoDate(to)}</ToDate>
    </KeyRate>
  </soap12:Body>
</soap12:Envelope>`

  const res = await fetch('https://www.cbr.ru/DailyInfoWebServ/DailyInfo.asmx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/soap+xml; charset=utf-8' },
    body,
  })
  if (!res.ok) throw new Error(`CBR KeyRate ${res.status}`)

  const xml = await res.text()
  const json = parser.parse(xml)
  const rows = json['soap:Envelope']?.['soap:Body']?.KeyRateResponse?.KeyRateResult?.['diffgr:diffgram']?.KeyRate?.KR
  const list = Array.isArray(rows) ? rows : rows ? [rows] : []
  if (list.length === 0) throw new Error('CBR KeyRate: пустой ответ')

  const latest = list.reduce((max, r) => (new Date(r.DT) > new Date(max.DT) ? r : max))
  return { rate: Number(latest.Rate), date: String(latest.DT).slice(0, 10) }
}

export function getKeyRate() {
  return cached('cbr-key-rate', 12 * 3600000, loadKeyRate)
}
