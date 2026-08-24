import { ReactNode } from 'react'
import {
  Bell,
  BookOpen,
  ChartLine,
  ChartLineUp,
  ClipboardText,
  GridFour,
  GridNine,
  Newspaper,
  Pulse,
  Sigma,
} from '@phosphor-icons/react'
import { ChartArea } from '@/components/chart/ChartArea'
import { OrderBook } from '@/components/orderbook/OrderBook'
import { TradesTape } from '@/components/orderbook/TradesTape'
import { OrderPanel } from '@/components/orders/OrderPanel'
import { PositionsTabsPanel } from '@/components/portfolio/PositionsTabsPanel'
import { NewsFeed } from '@/components/news/NewsFeed'
import { PriceAlerts } from '@/components/alerts/PriceAlerts'
import { MarketOverview } from '@/components/market/MarketOverview'
import { Heatmap } from '@/components/market/Heatmap'
import { OptionsPanel } from '@/components/options/OptionsPanel'
import { OptionsBoard } from '@/components/options/OptionsBoard'

export type WidgetType =
  | 'chart'
  | 'orderbook'
  | 'trades'
  | 'orderPanel'
  | 'positionsTabs'
  | 'news'
  | 'alerts'
  | 'marketOverview'
  | 'heatmap'
  | 'options'
  | 'optionsBoard'

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

export const GRID_COLS = 10

export const WIDGET_REGISTRY: Record<WidgetType, WidgetDefinition> = {
  chart: {
    label: 'График',
    icon: <ChartLine size={14} />,
    layout: { x: 0, y: 0, w: 7, h: 14, minW: 4, minH: 8 },
    render: ({ onRemove }) => <ChartArea onRemove={onRemove} />,
  },
  positionsTabs: {
    label: 'Позиции и заявки',
    icon: <ClipboardText size={14} />,
    layout: { x: 0, y: 14, w: 7, h: 8, minW: 4, minH: 5 },
    render: ({ onRemove }) => <PositionsTabsPanel onRemove={onRemove} />,
  },
  orderbook: {
    label: 'Стакан заявок',
    icon: <BookOpen size={14} />,
    // +глубина рынка над лесенкой
    layout: { x: 7, y: 0, w: 3, h: 10, minW: 2, minH: 7 },
    render: ({ onRemove }) => <OrderBook onRemove={onRemove} />,
  },
  trades: {
    label: 'Лента сделок',
    icon: <Pulse size={14} />,
    layout: { x: 7, y: 10, w: 3, h: 7, minW: 2, minH: 5 },
    render: ({ onRemove }) => <TradesTape onRemove={onRemove} />,
  },
  orderPanel: {
    label: 'Ордер',
    icon: <ChartLineUp size={14} />,
    // Высота с запасом: кнопки, тип, цена, объём, быстрые кнопки, сумма/остаток и submit целиком помещаются без обрезки
    layout: { x: 7, y: 17, w: 3, h: 17, minW: 2, minH: 13 },
    render: ({ onRemove }) => <OrderPanel onRemove={onRemove} />,
  },
  news: {
    label: 'Новости',
    icon: <Newspaper size={14} />,
    layout: { x: 7, y: 41, w: 3, h: 8, minW: 2, minH: 5 },
    render: ({ onRemove }) => <NewsFeed onRemove={onRemove} />,
  },
  alerts: {
    label: 'Ценовые алерты',
    icon: <Bell size={14} />,
    layout: { x: 0, y: 22, w: 4, h: 10, minW: 3, minH: 6 },
    render: ({ onRemove }) => <PriceAlerts onRemove={onRemove} />,
  },
  marketOverview: {
    label: 'Обзор рынка',
    icon: <Pulse size={14} />,
    layout: { x: 0, y: 32, w: 3, h: 12, minW: 2, minH: 7 },
    render: ({ onRemove }) => <MarketOverview onRemove={onRemove} />,
  },
  heatmap: {
    label: 'Тепловая карта',
    icon: <GridFour size={14} />,
    layout: { x: 3, y: 32, w: 4, h: 10, minW: 3, minH: 6 },
    render: ({ onRemove }) => <Heatmap onRemove={onRemove} />,
  },
  options: {
    label: 'Опционы',
    icon: <Sigma size={14} />,
    layout: { x: 0, y: 42, w: 4, h: 12, minW: 3, minH: 7 },
    render: ({ onRemove }) => <OptionsPanel onRemove={onRemove} />,
  },
  optionsBoard: {
    label: 'Доска опционов',
    icon: <GridNine size={14} />,
    layout: { x: 4, y: 42, w: 6, h: 12, minW: 4, minH: 7 },
    render: ({ onRemove }) => <OptionsBoard onRemove={onRemove} />,
  },
}

export const DEFAULT_WIDGETS: WidgetType[] = [
  'chart',
  'positionsTabs',
  'orderbook',
  'trades',
  'orderPanel',
  'news',
]
