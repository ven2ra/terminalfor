/**
 * Алерты по техдефолтам/дефолтам эмитентов облигаций — бесплатная замена
 * платному шлюзу e-disclosure.ru для конкретно этого сигнала: MOEX сама
 * публикует его в ISS (HASDEFAULT/HASTECHNICALDEFAULT, см. qualifiedInvestor.js)
 * тем же составом, что и на https://www.moex.com/s28. Проверяем только уже
 * отслеживаемый топ-150 ликвидных облигаций (bonds.js) — тянуть детальную
 * карточку по каждой из ~3000+ корпоративных облигаций ради этого недёшево,
 * а дефолты почти всегда случаются у бумаг, которые уже не первый день неликвидны
 * задолго до дефолта, так что риск пропустить конкретно ликвидную бумагу невелик.
 */
import { cached } from './cache.js'
import { getBonds } from './bonds.js'
import { getInstrumentFlags } from './qualifiedInvestor.js'

// Тикер → время первого обнаружения дефолта/техдефолта — чтобы в ленте у
// алерта была стабильная дата, а не "только что" при каждом обновлении кэша
const firstSeenAt = new Map()

async function loadDefaultAlerts() {
  const bonds = await getBonds()
  const flagResults = await Promise.allSettled(bonds.map((b) => getInstrumentFlags(b.ticker)))

  const alerts = []
  const stillFlagged = new Set()

  for (let i = 0; i < bonds.length; i++) {
    const result = flagResults[i]
    if (result.status !== 'fulfilled') continue
    const flags = result.value
    if (!flags.hasDefault && !flags.hasTechnicalDefault) continue

    const bond = bonds[i]
    stillFlagged.add(bond.ticker)
    if (!firstSeenAt.has(bond.ticker)) firstSeenAt.set(bond.ticker, Date.now())

    const kind = flags.hasDefault ? 'Дефолт' : 'Технический дефолт'
    alerts.push({
      id: `default-${bond.ticker}`,
      title: `⚠️ ${kind}: ${bond.name} (${bond.ticker})`,
      source: 'MOEX ISS',
      link: `https://www.moex.com/ru/issue.aspx?board=TQCB&code=${encodeURIComponent(bond.ticker)}`,
      tag: 'company',
      time: firstSeenAt.get(bond.ticker),
      important: true,
    })
  }

  // Бумага больше не флагована (погашена/выкуплена/делистинг) — не копим её вечно
  for (const ticker of firstSeenAt.keys()) {
    if (!stillFlagged.has(ticker)) firstSeenAt.delete(ticker)
  }

  return alerts
}

export function getBondDefaultAlerts() {
  return cached('bond-default-alerts', 3600000, loadDefaultAlerts)
}
