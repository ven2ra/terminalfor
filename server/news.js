import { XMLParser } from 'fast-xml-parser'
import { cached } from './cache.js'

const parser = new XMLParser({ ignoreAttributes: false })

const FEEDS = [
  { url: 'https://rssexport.rbc.ru/rbcnews/news/30/full.rss', source: 'РБК', tag: 'market' },
  { url: 'https://www.finam.ru/analysis/conews/rsspoint', source: 'Финам', tag: 'company' },
]

function stripHtml(text) {
  return String(text ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function loadFeed({ url, source, tag }) {
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
      tag,
      time: Number.isFinite(pubDate) ? pubDate : Date.now(),
    }
  })
}

async function loadAllNews() {
  const results = await Promise.allSettled(FEEDS.map(loadFeed))
  const items = results.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value)
  items.sort((a, b) => b.time - a.time)
  return items.slice(0, 40)
}

export function getNews() {
  return cached('news', 90000, loadAllNews)
}
