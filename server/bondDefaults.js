/**
 * Алерты о НОВЫХ техдефолтах/дефолтах эмитентов облигаций — частичная
 * бесплатная замена платному шлюзу e-disclosure.ru для этого сигнала.
 *
 * ВАЖНО про сами поля ISS: HASDEFAULT/HASTECHNICALDEFAULT (см.
 * qualifiedInvestor.js) официально называются "БылДефолт"/"БылТехнический-
 * Дефолт" — это ИСТОРИЧЕСКИЕ флаги без даты события, они не сбрасываются
 * после устранения просрочки. Показывать бумагу с уже стоящим флагом как
 * "новость" в ленте было бы введением в заблуждение — выглядело бы как
 * "случилось только что", хотя это может быть эпизод многолетней давности.
 *
 * Поэтому здесь не публикуется сырой снимок "у кого сейчас стоит флаг", а
 * отслеживаются именно ПЕРЕХОДЫ 0→1: на первом запуске все уже флагованные
 * бумаги фиксируются как "база" и в ленту не идут; в новости попадают
 * только те, что стали флагованы уже ПОСЛЕ этого первого запуска. База
 * сохраняется на диск (volume bond-default-baseline в docker-compose.yml),
 * иначе пересоздание контейнера обнуляло бы её и старые флаги снова
 * считались бы "новыми" при каждом деплое.
 *
 * Проверяем только уже отслеживаемый топ-150 ликвидных облигаций (bonds.js) —
 * тянуть детальную карточку по каждой из ~3000+ корпоративных облигаций
 * ради этого недёшево.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { cached } from './cache.js'
import { getBonds } from './bonds.js'
import { getInstrumentFlags } from './qualifiedInvestor.js'

const BASELINE_PATH = process.env.BOND_DEFAULT_BASELINE_PATH ?? './data/bond-default-baseline.json'

// { initialized: bool, tickers: { [ticker]: { kind, firstSeenAt } } }
let state = null

async function loadState() {
  if (state) return state
  try {
    state = JSON.parse(await readFile(BASELINE_PATH, 'utf-8'))
  } catch {
    state = { initialized: false, tickers: {} }
  }
  return state
}

async function saveState() {
  await mkdir(dirname(BASELINE_PATH), { recursive: true })
  await writeFile(BASELINE_PATH, JSON.stringify(state), 'utf-8')
}

async function loadDefaultAlerts() {
  const bonds = await getBonds()
  const flagResults = await Promise.allSettled(bonds.map((b) => getInstrumentFlags(b.ticker)))
  const s = await loadState()
  const isBaselineRun = !s.initialized

  const alerts = []
  let dirty = false

  for (let i = 0; i < bonds.length; i++) {
    const result = flagResults[i]
    if (result.status !== 'fulfilled') continue
    const flags = result.value
    const bond = bonds[i]

    if (!flags.hasDefault && !flags.hasTechnicalDefault) {
      // Флаг сняли (маловероятно, но возможно при погашении/делистинге) —
      // не копим такую бумагу в базе вечно, следующий техдефолт по ней
      // снова должен считаться новым событием
      if (s.tickers[bond.ticker]) {
        delete s.tickers[bond.ticker]
        dirty = true
      }
      continue
    }

    const kind = flags.hasDefault ? 'Дефолт' : 'Технический дефолт'
    const existing = s.tickers[bond.ticker]

    if (!existing) {
      // baseline: true — флаг уже стоял до того, как мы начали следить (либо
      // это самый первый запуск вообще). Такие записи никогда не считаются
      // новостью, не только на этом конкретном прогоне
      s.tickers[bond.ticker] = { kind, firstSeenAt: Date.now(), baseline: isBaselineRun }
      dirty = true
    } else if (existing.kind !== kind) {
      // Техдефолт перерос в полный дефолт — обновляем запись, но не поднимаем
      // повторно как новое событие с нуля
      s.tickers[bond.ticker] = { ...existing, kind }
      dirty = true
    }

    const record = s.tickers[bond.ticker]
    if (record.baseline) continue

    alerts.push({
      id: `default-${bond.ticker}`,
      title: `⚠️ ${kind} (в истории эмитента): ${bond.name} (${bond.ticker})`,
      source: 'MOEX ISS',
      link: `https://www.moex.com/ru/issue.aspx?board=TQCB&code=${encodeURIComponent(bond.ticker)}`,
      tag: 'company',
      time: record.firstSeenAt,
      important: true,
    })
  }

  if (isBaselineRun) {
    s.initialized = true
    dirty = true
  }
  if (dirty) await saveState()

  return alerts
}

export function getBondDefaultAlerts() {
  return cached('bond-default-alerts', 3600000, loadDefaultAlerts)
}
