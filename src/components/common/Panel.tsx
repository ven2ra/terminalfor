import { PropsWithChildren, ReactNode } from 'react'

interface PanelProps {
  title: string
  icon?: ReactNode
  actions?: ReactNode
  noPadding?: boolean
  className?: string
}

/** Стандартная панель рабочей области терминала: заголовок + содержимое */
export function Panel({ title, icon, actions, noPadding, className = '', children }: PropsWithChildren<PanelProps>) {
  return (
    <div className={`flex h-full flex-col bg-bg-panel ${className}`}>
      <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {icon}
          <span>{title}</span>
        </div>
        {actions}
      </div>
      <div className={`min-h-0 flex-1 overflow-auto ${noPadding ? '' : 'p-3'}`}>{children}</div>
    </div>
  )
}
