import './proxy.js'
import express from 'express'
import { getSecurities, getExtraSecurities, getCandles, getOlderCandles, getTrades, isValidTicker } from './moex.js'
import { getNews } from './news.js'
import { getCalendar } from './calendar.js'
import { proxyLogo } from './logos.js'
import { getOptionAssets, getOptionsForAsset, getOptionChain } from './options.js'
import { getInstrumentFlags } from './qualifiedInvestor.js'
import { tinvestEnabled } from './tinvest.js'
import { getTapeCatalog, getTapeQuotes } from './tape.js'

const app = express()
const PORT = process.env.PORT || 4000

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/api/securities', async (_req, res) => {
  try {
    res.json(await getSecurities())
  } catch (err) {
    console.error('securities error:', err.message)
    res.status(502).json({ error: 'moex_unavailable' })
  }
})

// Облигации + фьючерсы отдельно от акций — не задерживают первую отрисовку
// основного списка (TQCB — 3000+ бумаг, запрос к ISS занимает секунды)
app.get('/api/securities/extra', async (_req, res) => {
  try {
    res.json(await getExtraSecurities())
  } catch (err) {
    console.error('extra securities error:', err.message)
    res.status(502).json({ error: 'moex_unavailable' })
  }
})

// Признаки бумаги "только для квалифицированных инвесторов" / "повышенный
// инвестиционный риск" — запрашивается лениво по конкретному тикеру
app.get('/api/instrument-flags/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  if (!isValidTicker(ticker)) return res.status(400).json({ error: 'invalid_ticker' })
  try {
    res.json(await getInstrumentFlags(ticker))
  } catch (err) {
    console.error('instrument flags error:', err.message)
    res.status(502).json({ error: 'moex_unavailable' })
  }
})

app.get('/api/candles/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  const interval = Number(req.query.interval ?? 1)
  if (!isValidTicker(ticker)) return res.status(400).json({ error: 'invalid_ticker' })
  try {
    res.json(await getCandles(ticker, interval))
  } catch (err) {
    console.error('candles error:', err.message)
    res.status(502).json({ error: 'moex_unavailable' })
  }
})

// Довыгрузка более старых баров при прокрутке графика влево (бесконечная история)
app.get('/api/candles/:ticker/older', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  const interval = Number(req.query.interval ?? 1)
  const before = Number(req.query.before)
  if (!isValidTicker(ticker)) return res.status(400).json({ error: 'invalid_ticker' })
  if (!Number.isFinite(before)) return res.status(400).json({ error: 'invalid_before' })
  try {
    res.json(await getOlderCandles(ticker, interval, before))
  } catch (err) {
    console.error('older candles error:', err.message)
    res.status(502).json({ error: 'moex_unavailable' })
  }
})

app.get('/api/trades/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  if (!isValidTicker(ticker)) return res.status(400).json({ error: 'invalid_ticker' })
  try {
    res.json(await getTrades(ticker))
  } catch (err) {
    console.error('trades error:', err.message)
    res.status(502).json({ error: 'moex_unavailable' })
  }
})

// Каталог небиржевых символов (валюты/индексы/нефть), доступных для добавления в бегущую строку
app.get('/api/tape/catalog', (_req, res) => {
  res.json(getTapeCatalog())
})

app.get('/api/tape', async (req, res) => {
  const symbolsParam = String(req.query.symbols ?? '')
  const symbols = symbolsParam
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => isValidTicker(s))
  if (symbols.length === 0) return res.json([])
  try {
    res.json(await getTapeQuotes(symbols))
  } catch (err) {
    console.error('tape error:', err.message)
    res.status(502).json({ error: 'moex_unavailable' })
  }
})

app.get('/api/news', async (_req, res) => {
  try {
    res.json(await getNews())
  } catch (err) {
    console.error('news error:', err.message)
    res.status(502).json({ error: 'news_unavailable' })
  }
})

app.get('/api/logo/:isin', (req, res) => {
  proxyLogo(req.params.isin.toUpperCase(), res)
})

app.get('/api/options/assets', async (_req, res) => {
  try {
    res.json(await getOptionAssets())
  } catch (err) {
    console.error('options assets error:', err.message)
    res.status(502).json({ error: 'moex_unavailable' })
  }
})

app.get('/api/options/list/:asset', async (req, res) => {
  try {
    res.json(await getOptionsForAsset(req.params.asset, req.query.expiry))
  } catch (err) {
    console.error('options list error:', err.message)
    res.status(502).json({ error: 'moex_unavailable' })
  }
})

app.get('/api/options/chain/:asset', async (req, res) => {
  try {
    res.json(await getOptionChain(req.params.asset, req.query.expiry))
  } catch (err) {
    console.error('options chain error:', err.message)
    res.status(502).json({ error: 'moex_unavailable' })
  }
})

app.get('/api/calendar', async (_req, res) => {
  try {
    res.json(await getCalendar())
  } catch (err) {
    console.error('calendar error:', err.message)
    res.status(502).json({ error: 'moex_unavailable' })
  }
})

app.listen(PORT, () => {
  console.log(`terminalfor-api listening on :${PORT}`)
  console.log(
    tinvestEnabled()
      ? '[tinvest] TINVEST_TOKEN задан — last price берётся без задержки через T-Invest API'
      : '[tinvest] TINVEST_TOKEN не задан — котировки идут напрямую с MOEX ISS (задержка ~15 мин у анонимного доступа)'
  )
})
