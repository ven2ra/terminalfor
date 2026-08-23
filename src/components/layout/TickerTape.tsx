import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, X } from '@phosphor-icons/react'
import { fetchTapeCatalog, fetchTapeQuotes, TapeCatalogEntry, TapeQuote } from '@/api/client'
import { useTapeStore } from '@/store/useTapeStore'
import { useMarketStore } from '@/store/useMarketStore'
import { formatPercent, formatPrice } from '@/lib/format'

const POLL_MS = 3000

interface ItemMenu {
  x: number
  y: number
  symbol: string
}

/** Не даёт контекстному меню вылезти за правый край окна */
function clampMenuX(x: number, menuWidth: number): number {
  return Math.min(x, window.innerWidth - menuWidth - 8)
}

/**
 * Бегущая строка вверху терминала: валюты, индексы, нефть, акции — по выбору
 * пользователя. ПКМ по котировке — удалить, ПКМ по свободному месту (или
 * кнопка "+") — добавить новую. Список символов сохраняется между сессиями.
 */
export function TickerTape() {
  const { symbols, addSymbol, removeSymbol } = useTapeStore()
  const { instruments } = useMarketStore()
  const [quotes, setQuotes] = useState<TapeQuote[]>([])
  const [catalog, setCatalog] = useState<TapeCatalogEntry[]>([])
  const [itemMenu, setItemMenu] = useState<ItemMenu | null>(null)
  const [addMenu, setAddMenu] = useState<{ x: number; y: number } | null>(null)
  const [addQuery, setAddQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTapeCatalog().then(setCatalog).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = () => {
      fetchTapeQuotes(symbols).then((data) => {
        if (!cancelled) setQuotes(data)
      }).catch(() => {})
    }
    load()
    const poll = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [symbols])

  useEffect(() => {
    if (!itemMenu && !addMenu) return
    const close = () => {
      setItemMenu(null)
      setAddMenu(null)
    }
    window.addEventListener('click', close)
    window.addEventListener('keydown', (e) => e.key === 'Escape' && close())
    return () => window.removeEventListener('click', close)
  }, [itemMenu, addMenu])

  const availableCatalog = useMemo(() => catalog.filter((c) => !symbols.includes(c.symbol)), [catalog, symbols])
  const availableShares = useMemo(() => {
    if (!addQuery.trim()) return []
    const q = addQuery.trim().toLowerCase()
    return instruments
      .filter((i) => !symbols.includes(i.ticker) && (i.ticker.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)))
      .slice(0, 6)
  }, [instruments, addQuery, symbols])

  const quoteBySymbol = new Map(quotes.map((q) => [q.symbol, q]))
  // Дублируем ленту дважды подряд — со сдвигом ровно на половину ширины анимация зацикливается бесшовно
  const loopItems = [...symbols, ...symbols]

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => {
        e.preventDefault()
        setItemMenu(null)
        setAddMenu({ x: clampMenuX(e.clientX, 256), y: e.clientY })
      }}
      className="group relative flex h-8 shrink-0 items-center overflow-hidden border-b border-border-color bg-bg-base"
    >
      <div className="flex shrink-0 animate-tape-scroll items-center group-hover:[animation-play-state:paused]">
        {loopItems.map((symbol, idx) => {
          const q = quoteBySymbol.get(symbol)
          const positive = (q?.change ?? 0) >= 0
          return (
            <button
              key={`${symbol}-${idx}`}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setAddMenu(null)
                setItemMenu({ x: clampMenuX(e.clientX, 200), y: e.clientY, symbol })
              }}
              onClick={(e) => {
                // Раньше убрать тикер из ленты можно было только правым
                // кликом — с клавиатуры (Tab + Enter/Space) действие было
                // недостижимо. Клик/Enter/Space открывает то же меню, но по
                // границам самой кнопки — координаты мыши для активации с
                // клавиатуры не заданы (0,0)
                e.stopPropagation()
                const rect = e.currentTarget.getBoundingClientRect()
                setAddMenu(null)
                setItemMenu({ x: clampMenuX(rect.left, 200), y: rect.bottom, symbol })
              }}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-xs"
              title="Клик или ПКМ — убрать из ленты"
            >
              <span className="font-semibold text-text-secondary">{q?.name ?? symbol}</span>
              {q ? (
                <>
                  <span className="font-tabular text-text-primary">{formatPrice(q.lastPrice)}</span>
                  <span className={`font-tabular ${positive ? 'text-buy' : 'text-sell'}`}>
                    {formatPercent(q.changePercent)}
                  </span>
                </>
              ) : (
                <span className="text-text-muted">…</span>
              )}
            </button>
          )
        })}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          setItemMenu(null)
          const rect = e.currentTarget.getBoundingClientRect()
          setAddMenu({ x: clampMenuX(rect.left, 256), y: rect.bottom })
        }}
        title="Добавить котировку"
        aria-label="Добавить котировку в ленту"
        // Как и звезда избранного в Watchlist — opacity-0 без [@media(hover:hover)]
        // прятал кнопку насовсем на тач-устройствах, где hover не существует
        className="ml-auto flex h-full shrink-0 items-center gap-1 border-l border-border-subtle bg-bg-base px-3 text-text-muted opacity-100 transition-opacity hover:text-text-primary [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
      >
        <Plus size={13} />
      </button>

      {itemMenu && (
        <div
          style={{ left: itemMenu.x, top: itemMenu.y }}
          className="fixed z-50 min-w-[160px] rounded-md border border-border-color bg-bg-elevated py-1 shadow-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              removeSymbol(itemMenu.symbol)
              setItemMenu(null)
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-sell hover:bg-bg-hover"
          >
            <X size={13} /> Убрать «{itemMenu.symbol}» из ленты
          </button>
        </div>
      )}

      {addMenu && (
        <div
          style={{ left: addMenu.x, top: addMenu.y }}
          className="fixed z-50 w-64 rounded-md border border-border-color bg-bg-elevated py-2 shadow-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 pb-2">
            <input
              autoFocus
              value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)}
              placeholder="Тикер акции…"
              className="w-full rounded border border-border-color bg-bg-base px-2 py-1 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>
          {availableShares.length > 0 && (
            <div className="max-h-40 overflow-auto border-b border-border-subtle pb-1">
              {availableShares.map((s) => (
                <button
                  key={s.ticker}
                  onClick={() => {
                    addSymbol(s.ticker)
                    setAddMenu(null)
                    setAddQuery('')
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-bg-hover"
                >
                  <span className="font-semibold text-text-primary">{s.ticker}</span>
                  <span className="truncate text-text-muted">{s.name}</span>
                </button>
              ))}
            </div>
          )}
          <div className="max-h-40 overflow-auto pt-1">
            {availableCatalog.length === 0 && availableShares.length === 0 && (
              <div className="px-3 py-1.5 text-xs text-text-muted">Начните вводить тикер акции</div>
            )}
            {availableCatalog.map((c) => (
              <button
                key={c.symbol}
                onClick={() => {
                  addSymbol(c.symbol)
                  setAddMenu(null)
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-bg-hover"
              >
                <Plus size={12} className="text-text-muted" />
                <span className="text-text-primary">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
