/**
 * Прокси логотипов инструментов. Раньше <img> в браузере ходил ПРЯМО на
 * внешний CDN invest-brands.cdn-tinkoff.ru — единственное место в проекте,
 * где фронтенд обращался не через наш бэкенд, а к стороннему хосту напрямую.
 * Это ломается в сетях, откуда CDN недоступен напрямую (прокси/файрвол), и не
 * даёт нам ни кэшировать ответ, ни в будущем добавить второй источник как
 * фолбэк. Теперь фронтенд всегда ходит на /api/logo/:isin, а этот модуль сам
 * решает, откуда взять картинку.
 */
const UPSTREAM = 'https://invest-brands.cdn-tinkoff.ru'
const ISIN_RE = /^[A-Z0-9]{12}$/

// ISIN, для которых источник только что ответил "нет логотипа" — не долбим
// апстрим повторно на каждый следующий запрос (разные пользователи, одна и
// та же неликвидная/недавно переименованная бумага)
const MISSING_TTL_MS = 6 * 60 * 60 * 1000
const missingSince = new Map()

function isKnownMissing(isin) {
  const since = missingSince.get(isin)
  if (since == null) return false
  if (Date.now() - since > MISSING_TTL_MS) {
    missingSince.delete(isin)
    return false
  }
  return true
}

export async function proxyLogo(isin, res) {
  if (!ISIN_RE.test(isin) || isKnownMissing(isin)) {
    res.status(404).end()
    return
  }

  try {
    const upstreamRes = await fetch(`${UPSTREAM}/${isin}x160.png`, { headers: { 'User-Agent': 'terminalfor/1.0' } })
    if (!upstreamRes.ok) {
      missingSince.set(isin, Date.now())
      res.status(404).end()
      return
    }
    const buf = Buffer.from(await upstreamRes.arrayBuffer())
    // Логотипы компаний не меняются от запроса к запросу — год в браузерном
    // кэше не даст лишний раз дёргать даже наш собственный сервер
    res.set('Content-Type', upstreamRes.headers.get('content-type') ?? 'image/png')
    res.set('Cache-Control', 'public, max-age=31536000, immutable')
    res.send(buf)
  } catch (err) {
    console.error('logo proxy error:', err.message)
    res.status(502).end()
  }
}
