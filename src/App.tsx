import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { TickerTape } from '@/components/layout/TickerTape'
import { MainGrid } from '@/components/layout/MainGrid'
import { GlobalContextMenu } from '@/components/common/GlobalContextMenu'
import { useMarketFeed } from '@/hooks/useMarketFeed'
import { useAlertsWatcher } from '@/hooks/useAlertsWatcher'
import { useDevtoolsDeterrent } from '@/hooks/useDevtoolsDeterrent'

export default function App() {
  // Опрашивает бэкенд за живыми котировками, стаканом, сделками и переоценивает портфель
  useMarketFeed()
  // Проверяет ценовые алерты на срабатывание по живым котировкам
  useAlertsWatcher()
  // Блокирует самые частые горячие клавиши DevTools — сдерживающий фактор,
  // не защита (см. комментарий в самом хуке)
  useDevtoolsDeterrent()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-base">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <TickerTape />
        <MainGrid />
      </div>
      <GlobalContextMenu />
    </div>
  )
}
