import { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react'

interface ResizableSplitProps {
  direction: 'horizontal' | 'vertical'
  /** Начальный размер первой панели в процентах (0-100) */
  initial?: number
  min?: number
  max?: number
}

/**
 * Универсальный сплиттер на два дочерних элемента с изменяемым размером
 * первой панели через перетаскивание разделителя мышью.
 */
export function ResizableSplit({
  direction,
  initial = 50,
  min = 15,
  max = 85,
  children,
}: PropsWithChildren<ResizableSplitProps>) {
  const [first, second] = Array.isArray(children) ? children : [children, null]
  const [size, setSize] = useState(initial)
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pos = direction === 'horizontal' ? e.clientX - rect.left : e.clientY - rect.top
      const total = direction === 'horizontal' ? rect.width : rect.height
      const percent = Math.min(max, Math.max(min, (pos / total) * 100))
      setSize(percent)
    },
    [direction, min, max]
  )

  const stopDragging = useCallback(() => {
    draggingRef.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stopDragging)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', stopDragging)
    }
  }, [onPointerMove, stopDragging])

  const startDragging = () => {
    draggingRef.current = true
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }

  const isHorizontal = direction === 'horizontal'

  return (
    <div ref={containerRef} className={`flex h-full w-full min-h-0 min-w-0 ${isHorizontal ? 'flex-row' : 'flex-col'}`}>
      <div style={{ [isHorizontal ? 'width' : 'height']: `${size}%` }} className="min-h-0 min-w-0 overflow-hidden">
        {first}
      </div>
      <div
        onPointerDown={startDragging}
        className={`resize-handle shrink-0 z-10 ${
          isHorizontal ? 'w-[3px] cursor-col-resize' : 'h-[3px] cursor-row-resize'
        }`}
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{second}</div>
    </div>
  )
}
