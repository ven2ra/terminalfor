import { useEffect, useRef, useState } from 'react'
import { ArrowCounterClockwise, Plus } from '@phosphor-icons/react'
import { useDashboardStore } from '@/store/useDashboardStore'
import { WIDGET_REGISTRY, WidgetType } from '@/dashboard/widgets'

/** Кнопка добавления виджета на рабочую область + сброс раскладки к дефолтной */
export function AddWidgetMenu() {
  const { widgets, addWidget, resetLayout } = useDashboardStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  // Сброс стирает всю пользовательскую раскладку — необратимо, требуем повторного клика.
  // Подтверждение снимается кликом мимо кнопки, а не по таймеру: на странице с
  // постоянно обновляющимися котировками таймер мог истечь до того, как второй
  // клик реально доходил до кнопки (гонка), из-за чего "Сбросить" выглядел
  // нерабочим — клик просто заново вооружал подтверждение вместо сброса
  const [confirmingReset, setConfirmingReset] = useState(false)

  const available = (Object.keys(WIDGET_REGISTRY) as WidgetType[]).filter((t) => !widgets.includes(t))

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
      if (resetRef.current && !resetRef.current.contains(e.target as Node)) setConfirmingReset(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const resetRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="flex items-center gap-2">
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={available.length === 0}
          className="flex items-center gap-1.5 rounded-md border border-border-color px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={13} /> Добавить виджет
        </button>
        {open && available.length > 0 && (
          <div className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-md border border-border-color bg-bg-elevated shadow-panel">
            {available.map((type) => (
              <button
                key={type}
                onClick={() => {
                  addWidget(type)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text-primary hover:bg-bg-hover"
              >
                {WIDGET_REGISTRY[type].icon}
                {WIDGET_REGISTRY[type].label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        ref={resetRef}
        onClick={() => {
          if (confirmingReset) {
            resetLayout()
            setConfirmingReset(false)
          } else {
            setConfirmingReset(true)
          }
        }}
        title={confirmingReset ? 'Точно сбросить всю раскладку? Нажмите ещё раз' : 'Сбросить раскладку'}
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
          confirmingReset
            ? 'border-sell bg-sell-bg text-sell'
            : 'border-border-color text-text-secondary hover:bg-bg-hover hover:text-text-primary'
        }`}
      >
        <ArrowCounterClockwise size={13} /> {confirmingReset ? 'Точно сбросить?' : 'Сбросить'}
      </button>
    </div>
  )
}
