import { Header } from '@/components/layout/Header'
import { TickerTape } from '@/components/layout/TickerTape'
import { MainGrid } from '@/components/layout/MainGrid'
import { useMarketFeed } from '@/hooks/useMarketFeed'
import { useAlertsWatcher } from '@/hooks/useAlertsWatcher'

export default function App() {
  // Опрашивает бэкенд за живыми котировками, стаканом, сделками и переоценивает портфель
  useMarketFeed()
  // Проверяет ценовые алерты на срабатывание по живым котировкам
  useAlertsWatcher()

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg-base">
      <Header />
      <TickerTape />
      <MainGrid />
    </div>
  )
}
