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
    <div className={`panel-frame flex h-full flex-col bg-bg-panel ${className}`}>
      <div
        className={`widget-drag-handle flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-3 py-2 ${
          draggable ? 'cursor-move select-none' : ''
        }`}
      >
        <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {draggable && <DotsSixVertical size={13} className="shrink-0 text-text-muted" />}
          {icon}
          <span className="truncate">{title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
