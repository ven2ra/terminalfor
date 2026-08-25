import { create } from 'zustand'
import { Instrument, OptionContract, OrderBookData, Trade } from '@/types'
import { fetchExtraSecurities, fetchSecurities, fetchTrades, SecurityDto } from '@/api/client'
import { synthesizeOrderBook } from '@/mock/orderbook'
import { isMarketOpenNow } from '@/lib/tradingHours'

export const DEFAULT_TICKER = 'SBER'

function toInstrument(dto: SecurityDto, prevFavorite: boolean | undefined): Instrument {
  return {
    ticker: dto.ticker,
    name: dto.name,
    isin: dto.isin,
    exchange: dto.exchange,
    currency: dto.currency,
    assetType: dto.assetType,
    priceUnit: dto.priceUnit,
    faceValue: dto.faceValue ?? null,
    isOfz: dto.isOfz,
    initialMargin: dto.initialMargin ?? null,
    lotSize: dto.lotSize,
    lastPrice: dto.lastPrice,
    change: dto.change,
    changePercent: dto.changePercent,
    volume: dto.volume,
    turnover: dto.turnover,
    bid: dto.bid,
    offer: dto.offer,
    dayHigh: dto.dayHigh,
    dayLow: dto.dayLow,
    dayOpen: dto.dayOpen,
    isFavorite: prevFavorite,
  }
}

const DEFAULT_FAVORITES = new Set(['SBER', 'LKOH', 'GAZP', 'YDEX'])

interface MarketState {
  instruments: Instrument[]
  selectedTicker: string
  orderBook: OrderBookData
  trades: Trade[]
  status: 'loading' | 'ready' | 'error'
  // Метка последнего успешного обновления и счётчик подряд идущих сбоев —
  // на них строится индикатор "не в сети"/"устарело" в Header: одиночный
  // сетевой сбой не должен пугать трейдера, а вот несколько подряд — сигнал,
  // что котировки могут быть неактуальны
  lastUpdatedAt: number | null
  consecutiveErrors: number
  loadSecurities: () => Promise<void>
  loadExtraSecurities: () => Promise<void>
  refreshOrderBook: () => void
  loadTrades: () => Promise<void>
  selectTicker: (ticker: string) => void
  selectOption: (contract: OptionContract) => void
  toggleFavorite: (ticker: string) => void
}

function currentInstrument(instruments: Instrument[], ticker: string): Instrument | undefined {
  return instruments.find((i) => i.ticker === ticker)
}

/** Рыночные данные с МосБиржи: полный список бумаг TQBR, стакан, лента сделок по выбранному тикеру */
export const useMarketStore = create<MarketState>((set, get) => ({
  instruments: [],
  selectedTicker: DEFAULT_TICKER,
  orderBook: { bids: [], asks: [] },
  trades: [],
  status: 'loading',
  lastUpdatedAt: null,
  consecutiveErrors: 0,

  loadSecurities: async () => {
    try {
      const dtos = await fetchSecurities()
      const prevByTicker = new Map(get().instruments.map((i) => [i.ticker, i.isFavorite]))
      const fresh = dtos.map((dto) => toInstrument(dto, prevByTicker.get(dto.ticker) ?? DEFAULT_FAVORITES.has(dto.ticker)))
      // Акции/фонды заменяем целиком, а ранее подгруженные облигации/фьючерсы
      // (из loadExtraSecurities) и открытый через клик опционный контракт
      // (из selectOption, своего опроса не имеет) сохраняем как есть
      const extra = get().instruments.filter(
        (i) => i.assetType === 'bond' || i.assetType === 'future' || i.assetType === 'option'
      )
      set({ instruments: [...fresh, ...extra], status: 'ready', lastUpdatedAt: Date.now(), consecutiveErrors: 0 })
      get().refreshOrderBook()
    } catch {
      const consecutiveErrors = get().consecutiveErrors + 1
      // Один сбой опроса — обычная сетевая рябь; статус "ошибка" показываем
      // трейдеру только после нескольких подряд, чтобы не мигать зря
      set({ consecutiveErrors, status: consecutiveErrors >= 3 ? 'error' : get().status })
    }
  },

  loadExtraSecurities: async () => {
    try {
      const dtos = await fetchExtraSecurities()
      const prevByTicker = new Map(get().instruments.map((i) => [i.ticker, i.isFavorite]))
      const extra = dtos.map((dto) => toInstrument(dto, prevByTicker.get(dto.ticker)))
      const rest = get().instruments.filter((i) => i.assetType !== 'bond' && i.assetType !== 'future')
      set({ instruments: [...rest, ...extra] })
    } catch {
      // сеть моргнула — оставляем то, что уже загружено (или пусто, если ещё не грузилось)
    }
  },

  refreshOrderBook: () => {
    // Вне торговой сессии (будни 06:50–23:50 МСК, выходные — только
    // сессия выходного дня 09:50–18:59) стакан замораживаем на последнем
    // известном состоянии и просто не опрашиваем дальше (UI показывает
    // "Торги закрыты")
    if (!isMarketOpenNow()) return
    const { instruments, selectedTicker } = get()
    const inst = currentInstrument(instruments, selectedTicker)
    if (!inst?.bid || !inst?.offer) return
    set({ orderBook: synthesizeOrderBook(inst.bid, inst.offer) })
  },

  loadTrades: async () => {
    // Та же логика, что и для стакана — лента сделок вне торговой сессии
    // тоже замораживается вместо показа несуществующих у брокера сделок
    if (!isMarketOpenNow()) return
    const ticker = get().selectedTicker
    try {
      const trades = await fetchTrades(ticker)
      if (get().selectedTicker === ticker) set({ trades })
    } catch {
      // сеть моргнула — просто оставляем предыдущую ленту до следующего опроса
    }
  },

  selectTicker: (ticker) => {
    // Стакан прошлого тикера не должен "просвечивать" под новым, пока не
    // придёт свежий (или пока не покажется оверлей "Торги закрыты")
    set({ selectedTicker: ticker, trades: [], orderBook: { bids: [], asks: [] } })
    get().refreshOrderBook()
    get().loadTrades()
  },

  // Опционы — витрина рынка (нет своей записи в общем списке инструментов,
  // их сотни на один базовый актив), поэтому при клике по контракту
  // "на лету" подмешиваем его в instruments, чтобы график/шапка получили
  // название и последнюю цену, как для обычной бумаги
  selectOption: (contract) => {
    const instrument: Instrument = {
      ticker: contract.ticker,
      name: contract.name,
      isin: null,
      exchange: 'MOEX',
      currency: 'RUB',
      assetType: 'option',
      priceUnit: 'currency',
      faceValue: null,
      lotSize: 1,
      lastPrice: contract.lastPrice ?? 0,
      change: 0,
      changePercent: contract.changePercent,
      volume: contract.volume,
      turnover: 0,
      bid: contract.bid,
      offer: contract.offer,
      dayHigh: null,
      dayLow: null,
      dayOpen: null,
    }
    set((state) => ({
      instruments: [...state.instruments.filter((i) => i.ticker !== instrument.ticker), instrument],
    }))
    get().selectTicker(instrument.ticker)
  },

  toggleFavorite: (ticker) => {
    set((state) => ({
      instruments: state.instruments.map((i) => (i.ticker === ticker ? { ...i, isFavorite: !i.isFavorite } : i)),
    }))
  },
}))
