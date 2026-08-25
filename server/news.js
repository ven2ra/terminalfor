import { XMLParser } from 'fast-xml-parser'
import { cached } from './cache.js'
import { stripHtml } from './text.js'
import { getTelegramGroups } from './telegram.js'
import { classifyTag, isImportantNews } from './classify.js'
import { getBondDefaultAlerts } from './bondDefaults.js'

const parser = new XMLParser({ ignoreAttributes: false })

// fallbackTag — тег для заголовков, которые classifyTag не признал политикой
const FEEDS = [
  { url: 'https://rssexport.rbc.ru/rbcnews/news/30/full.rss', source: 'РБК', fallbackTag: 'market' },
  { url: 'https://www.finam.ru/analysis/conews/rsspoint', source: 'Финам', fallbackTag: 'company' },
  // Общественно-политическая повестка — курс рынка зависит от неё не меньше, чем от отчётностей.
  // Ленты общие (не только политика), поэтому тег ставится по содержанию заголовка, см. classify.js
  { url: 'https://ria.ru/export/rss2/index.xml', source: 'РИА Новости', fallbackTag: 'society' },
  { url: 'https://lenta.ru/rss/news', source: 'Lenta.ru', fallbackTag: 'society' },
]

async function loadFeed({ url, source, fallbackTag }) {
  const res = await fetch(url, { headers: { 'User-Agent': 'terminalfor/1.0' } })
  if (!res.ok) throw new Error(`RSS ${res.status} for ${url}`)
  const xml = await res.text()
  const json = parser.parse(xml)
  const items = json?.rss?.channel?.item ?? []
  const list = Array.isArray(items) ? items : [items]

  return list.slice(0, 20).map((item) => {
    const title = stripHtml(item.title)
    const link = typeof item.link === 'string' ? item.link : item.link?.['#text'] ?? ''
    const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : Date.now()
    return {
      id: link || `${source}-${title}-${pubDate}`,
      title,
      link,
      source,
      tag: classifyTag(title, fallbackTag),
      time: Number.isFinite(pubDate) ? pubDate : Date.now(),
      important: isImportantNews(title),
    }
  })
}

const PER_SOURCE_GUARANTEED = 8
const TOTAL_LIMIT = 70

/**
 * Быстрые источники (политические ленты постят каждую минуту) иначе вымывают
 * из общей выдачи медленные (Финам, Telegram-каналы). Поэтому у каждого
 * источника сначала резервируется гарантированная доля, а уже остаток мест
 * добирается по общей свежести — так видна вся подписка, а не только топ по времени.
 */
function mergeFairly(groups) {
  const guaranteed = []
  const leftover = []
  for (const group of groups) {
    guaranteed.push(...group.slice(0, PER_SOURCE_GUARANTEED))
    leftover.push(...group.slice(PER_SOURCE_GUARANTEED))
  }
  leftover.sort((a, b) => b.time - a.time)
  const remainingSlots = Math.max(0, TOTAL_LIMIT - guaranteed.length)
  const merged = [...guaranteed, ...leftover.slice(0, remainingSlots)]
  merged.sort((a, b) => b.time - a.time)
  return merged
}

async function loadAllNews() {
  const [feedResults, telegramGroups, defaultAlerts] = await Promise.all([
    Promise.allSettled(FEEDS.map(loadFeed)),
    getTelegramGroups(),
    getBondDefaultAlerts().catch(() => []),
  ])
  const groups = [
    ...feedResults.filter((r) => r.status === 'fulfilled').map((r) => r.value),
    ...telegramGroups,
    // Не режем гарантированной долей PER_SOURCE_GUARANTEED — алертов о
    // дефолтах в любой момент немного (единицы), пусть попадают в ленту все
    defaultAlerts,
  ]
  return mergeFairly(groups)
}

export function getNews() {
  return cached('news', 90000, loadAllNews)
}
