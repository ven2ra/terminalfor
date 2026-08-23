import { cached } from './cache.js'
import { stripHtml } from './text.js'
import { classifyTag } from './classify.js'

/**
 * Публичные Telegram-каналы читаются через веб-превью t.me/s/<channel> —
 * оно рендерится сервером Telegram без авторизации и содержит последние
 * посты канала в HTML. Официального RSS/API для каналов без бота нет,
 * поэтому это единственный способ получить их без токена бота.
 */
const CHANNELS = [
  { username: 'markettwits', label: 'MarketTwits' },
  // Второй канал уточняется пользователем — приватная ссылка t.me/+... требует
  // Bot API или MTProto-авторизации, добавим по мере готовности учётных данных.
]

async function loadChannel({ username, label }) {
  const res = await fetch(`https://t.me/s/${username}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; terminalfor/1.0)' },
  })
  if (!res.ok) throw new Error(`Telegram ${res.status} for ${username}`)
  const html = await res.text()

  // Каждый пост начинается с этого маркера — режем HTML на блоки по одному посту
  const blocks = html.split('class="tgme_widget_message ').slice(1)
  const items = []

  for (const block of blocks) {
    const postMatch = block.match(/data-post="([^"]+)"/)
    const timeMatch = block.match(/<time[^>]*datetime="([^"]+)"/)
    const textMatch = block.match(/tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/)
    if (!postMatch || !textMatch) continue

    const title = stripHtml(textMatch[1]).slice(0, 320)
    if (!title) continue

    const time = timeMatch ? new Date(timeMatch[1]).getTime() : Date.now()
    items.push({
      id: `tg-${postMatch[1]}`,
      title,
      link: `https://t.me/${postMatch[1]}`,
      source: label,
      tag: classifyTag(title, 'market'),
      time: Number.isFinite(time) ? time : Date.now(),
    })
  }

  return items.slice(-15)
}

/** Возвращает посты каждого канала отдельным списком (новые сначала) — нужно для честного слияния источников */
async function loadAllTelegramGroups() {
  const results = await Promise.allSettled(CHANNELS.map(loadChannel))
  return results.filter((r) => r.status === 'fulfilled').map((r) => [...r.value].reverse())
}

export function getTelegramGroups() {
  return cached('telegram-news', 90000, loadAllTelegramGroups)
}
