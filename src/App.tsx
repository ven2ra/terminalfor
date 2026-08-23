import { Header } from '@/components/layout/Header'
import { MainGrid } from '@/components/layout/MainGrid'
import { useMockFeed } from '@/hooks/useMockFeed'

export default function App() {
  // Запускает имитацию потока рыночных данных на всё время жизни приложения
  useMockFeed()

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg-base">
      <Header />
      <MainGrid />
    </div>
  )
}
