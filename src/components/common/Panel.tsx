import { PropsWithChildren, ReactNode } from 'react'
import { DotsSixVertical, X } from '@phosphor-icons/react'

interface PanelProps {
  title: string
  icon?: ReactNode
  actions?: ReactNode
  noPadding?: boolean
  className?: string
  /** Делает заголовок панели ручкой перетаскивания виджета на рабочей области */
  draggable?: boolean
  /** Показывает кнопку закрытия виджета в заголовке */
  onRemove?: () => void
}

/** Стандартная панель рабочей области терминала: заголовок + содержимое */
export function Panel({
  title,
  icon,
  actions,
  noPadding,
  className = '',
  draggable,
  onRemove,
  children,
}: PropsWithChildren<PanelProps>) {
  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-xl border border-border-color bg-bg-panel shadow-panel before:absolute before:left-0 before:top-3 before:z-10 before:h-4 before:w-[3px] before:rounded-full before:bg-accent before:content-[''] ${className}`}
    >
      <div
        className={`widget-drag-handle flex h-9 shrink-0 items-center gap-2 border-b border-border-subtle bg-bg-head px-3 ${
          draggable ? 'cursor-move select-none' : ''
        }`}
      >
        <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-text-primary">
          {draggable && <DotsSixVertical size={13} className="shrink-0 text-text-muted" />}
          {icon}
          <span className="truncate">{title}</span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {actions}
          {onRemove && (
            <button
              onClick={onRemove}
              aria-label="Удалить виджет"
              className="rounded p-0.5 text-text-muted transition-colors hover:bg-sell-bg hover:text-sell"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      <div className={`min-h-0 flex-1 overflow-auto ${noPadding ? '' : 'p-3'}`}>{children}</div>
    </div>
  )
}
