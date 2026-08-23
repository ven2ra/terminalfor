/**
 * Простой in-memory кэш с TTL. Используется, чтобы не дёргать
 * апстрим (MOEX ISS, RSS-ленты) на каждый запрос браузера —
 * данные обновляются по расписанию и раздаются всем клиентам из памяти.
 */
const store = new Map()

export async function cached(key, ttlMs, loader) {
  const now = Date.now()
  const hit = store.get(key)
  if (hit && now - hit.time < ttlMs) {
    return hit.value
  }
  if (hit?.pending) {
    return hit.pending
  }

  const pending = loader()
    .then((value) => {
      store.set(key, { value, time: Date.now() })
      return value
    })
    .catch((err) => {
      store.delete(key)
      throw err
    })

  store.set(key, { ...(hit ?? {}), pending })
  return pending
}
