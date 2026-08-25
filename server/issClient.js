/** Общие хелперы для запросов к MOEX ISS — используются moex.js и tape.js */
import { fetchDirectFirst } from './proxy.js'

export const ISS_BASE = 'https://iss.moex.com/iss'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Бывают точечные сетевые сбои при большом числе параллельных запросов — один повтор их гасит */
export async function fetchJson(url, attempt = 0) {
  try {
    const res = await fetchDirectFirst(url, { headers: { 'User-Agent': 'terminalfor/1.0' } })
    if (!res.ok) throw new Error(`MOEX ISS ${res.status} for ${url}`)
    return await res.json()
  } catch (err) {
    if (attempt >= 1) throw err
    await sleep(300)
    return fetchJson(url, attempt + 1)
  }
}

export function rowsToObjects(block) {
  if (!block) return []
  return block.data.map((row) => Object.fromEntries(block.columns.map((col, i) => [col, row[i]])))
}
