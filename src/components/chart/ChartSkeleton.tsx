/** Заглушка загрузки графика — силуэт свечей вместо текста "Загрузка…" */
export function ChartSkeleton() {
  // Псевдослучайные, но стабильные высоты столбиков (без Math.random, чтобы не дёргалось при ре-рендерах)
  const bars = Array.from({ length: 48 }, (_, i) => {
    const wave = Math.sin(i * 0.4) * 22 + Math.sin(i * 0.13) * 14
    return 30 + wave
  })

  return (
    <div className="absolute inset-0 z-10 flex items-end gap-[3px] overflow-hidden bg-bg-panel px-4 pb-8 pt-10">
      {bars.map((h, i) => (
        <div key={i} className="skeleton min-w-[4px] flex-1 rounded-sm" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}
