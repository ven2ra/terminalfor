import { ResizableSplit } from '@/components/common/ResizableSplit'
import { Watchlist } from '@/components/watchlist/Watchlist'
import { ChartArea } from '@/components/chart/ChartArea'
import { OrderBook } from '@/components/orderbook/OrderBook'
import { TradesTape } from '@/components/orderbook/TradesTape'
import { OrderPanel } from '@/components/orders/OrderPanel'
import { PortfolioPanel } from '@/components/portfolio/PortfolioPanel'
import { NewsFeed } from '@/components/news/NewsFeed'

/**
 * Основная рабочая область: адаптивная сетка панелей с изменяемыми размерами.
 * Слева — список инструментов, в центре — график и портфель, справа —
 * стакан заявок, лента сделок, панель ордеров и новости.
 */
export function MainGrid() {
  return (
    <div className="min-h-0 flex-1">
      <ResizableSplit direction="horizontal" initial={17} min={12} max={26}>
        <Watchlist />
        <ResizableSplit direction="horizontal" initial={70} min={50} max={82}>
          <ResizableSplit direction="vertical" initial={62} min={35} max={80}>
            <ChartArea />
            <PortfolioPanel />
          </ResizableSplit>
          <ResizableSplit direction="vertical" initial={42} min={20} max={65}>
            <ResizableSplit direction="horizontal" initial={55} min={30} max={75}>
              <OrderBook />
              <TradesTape />
            </ResizableSplit>
            <ResizableSplit direction="vertical" initial={48} min={25} max={75}>
              <OrderPanel />
              <NewsFeed />
            </ResizableSplit>
          </ResizableSplit>
        </ResizableSplit>
      </ResizableSplit>
    </div>
  )
}
