import './proxy.js'
import express from 'express'
import { getSecurities, getCandles, getTrades, isValidTicker } from './moex.js'
import { getNews } from './news.js'

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

app.get('/api/news', async (_req, res) => {
  try {
    res.json(await getNews())
  } catch (err) {
    console.error('news error:', err.message)
    res.status(502).json({ error: 'news_unavailable' })
  }
})

app.listen(PORT, () => {
  console.log(`terminalfor-api listening on :${PORT}`)
})
