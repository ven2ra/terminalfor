import { ProxyAgent, setGlobalDispatcher } from 'undici'

/**
 * Если сервер сидит в сети, откуда t.me (или вообще внешние домены) недоступны
 * напрямую, задайте HTTPS_PROXY (или HTTP_PROXY) — все исходящие запросы
 * бэкенда (MOEX ISS, RSS-ленты, Telegram-превью) пойдут через него.
 * Импортируется первым в index.js ради побочного эффекта, до первого fetch().
 */
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy

if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl))
  console.log(`[proxy] исходящие запросы бэкенда идут через ${proxyUrl}`)
}
