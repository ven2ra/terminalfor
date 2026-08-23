import { ReactNode } from 'react'
import { Activity, BookOpen, CandlestickChart, LineChart, Newspaper, Star, Wallet } from 'lucide-react'
import { Watchlist } from '@/components/watchlist/Watchlist'
import { ChartArea } from '@/components/chart/ChartArea'
import { OrderBook } from '@/components/orderbook/OrderBook'
import { TradesTape } from '@/components/orderbook/TradesTape'
import { OrderPanel } from '@/components/orders/OrderPanel'
import { PortfolioPanel } from '@/components/portfolio/PortfolioPanel'
import { NewsFeed } from '@/components/news/NewsFeed'

export type WidgetType = 'watchlist' | 'chart' | 'orderbook' | 'trades' | 'orderPanel' | 'portfolio' | 'news'

interface WidgetLayoutDefaults {
  x: number
  y: number
  w: number
  h: number
  minW: number
  minH: number
}

interface WidgetDefinition {
  label: string
  icon: ReactNode
  layout: WidgetLayoutDefaults
  render: (props: { onRemove: () => void }) => ReactNode
}

export const WIDGET_REGISTRY: Record<WidgetType, WidgetDefinition> = {
  watchlist: {
    label: 'Инструменты',
    icon: <Star size={14} />,
    layout: { x: 0, y: 0, w: 2, h: 22, minW: 2, minH: 8 },
    render: ({ onRemove }) => <Watchlist onRemove={onRemove} />,
  },
  chart: {
    label: 'График',
    icon: <CandlestickChart size={14} />,
    layout: { x: 2, y: 0, w: 7, h: 14, minW: 4, minH: 8 },
    render: ({ onRemove }) => <ChartArea onRemove={onRemove} />,
  },
  portfolio: {
    label: 'Портфель',
    icon: <Wallet size={14} />,
    layout: { x: 2, y: 14, w: 7, h: 8, minW: 4, minH: 5 },
    render: ({ onRemove }) => <PortfolioPanel onRemove={onRemove} />,
  },
  orderbook: {
    label: 'Стакан заявок',
    icon: <BookOpen size={14} />,
    layout: { x: 9, y: 0, w: 3, h: 7, minW: 2, minH: 5 },
    render: ({ onRemove }) => <OrderBook onRemove={onRemove} />,
  },
  trades: {
    label: 'Лента сделок',
    icon: <Activity size={14} />,
    layout: { x: 9, y: 7, w: 3, h: 7, minW: 2, minH: 5 },
    render: ({ onRemove }) => <TradesTape onRemove={onRemove} />,
  },
  orderPanel: {
    label: 'Ордер',
    icon: <LineChart size={14} />,
    // Высота с запасом: кнопки, тип, цена, объём, быстрые кнопки, сумма/остаток и submit целиком помещаются без обрезки
    layout: { x: 9, y: 14, w: 3, h: 17, minW: 2, minH: 13 },
    render: ({ onRemove }) => <OrderPanel onRemove={onRemove} />,
  },
  news: {
    label: 'Новости',
    icon: <Newspaper size={14} />,
    layout: { x: 9, y: 31, w: 3, h: 8, minW: 2, minH: 5 },
    render: ({ onRemove }) => <NewsFeed onRemove={onRemove} />,
  },
}

export const DEFAULT_WIDGETS: WidgetType[] = ['watchlist', 'chart', 'portfolio', 'orderbook', 'trades', 'orderPanel', 'news']
