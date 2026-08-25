import { Agent, ProxyAgent, fetch as undiciFetch, setGlobalDispatcher } from 'undici'

/**
 * Если сервер сидит в сети, откуда t.me (или вообще внешние домены) недоступны
 * напрямую, задайте HTTPS_PROXY (или HTTP_PROXY) — все исходящие запросы
 * бэкенда (MOEX ISS, RSS-ленты, Telegram-превью) пойдут через него.
 * Импортируется первым в index.js ради побочного эффекта, до первого fetch().
 */
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy

if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl))
  // Node сам вшивает undici как глобальный fetch() — это ДРУГОЙ инстанс
  // модуля, чем пакет "undici" из node_modules (может быть другая версия),
  // со своим отдельным реестром диспетчеров. setGlobalDispatcher() выше
  // настраивает прокси только для пакета "undici", а весь код проекта
  // вызывает голый fetch()/globalThis.fetch — он прокси не видел и ходил
  // напрямую в обход, даже когда сам прокси был настроен верно. Подменяем
  // глобальный fetch на fetch из настроенного пакета "undici", чтобы весь
  // существующий код (вызывающий обычный fetch()) реально пошёл через прокси.
  globalThis.fetch = undiciFetch
  console.log(`[proxy] исходящие запросы бэкенда идут через ${proxyUrl}`)
}

// Диспетчер БЕЗ прокси — для доменов, которые обычно доступны напрямую, даже
// когда HTTPS_PROXY настроен ради чего-то одного конкретного (изначально —
// только ради t.me). MOEX ISS и cbr.ru — российские, лишний хоп через прокси
// на каждый запрос заметно (секунды) замедляет вообще всё в терминале.
const directAgent = new Agent({ connectTimeout: 4000 })

/**
 * Сначала пробует подключиться напрямую (короткий таймаут), и только при
 * неудаче — через globalThis.fetch (проксируемый, если прокси настроен).
 * Используйте для доменов, которые не были причиной завести прокси —
 * не факт, что им вообще нужен лишний хоп.
 */
export async function fetchDirectFirst(url, init) {
  try {
    return await undiciFetch(url, { ...init, dispatcher: directAgent })
  } catch {
    return fetch(url, init)
  }
}
