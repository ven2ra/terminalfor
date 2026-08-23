import { Header } from '@/components/layout/Header'
import { MainGrid } from '@/components/layout/MainGrid'
import { useMarketFeed } from '@/hooks/useMarketFeed'

export default function App() {
  // Опрашивает бэкенд за живыми котировками, стаканом, сделками и переоценивает портфель
  useMarketFeed()

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg-base">
      <Header />
      <MainGrid />
    </div>
  )
}
