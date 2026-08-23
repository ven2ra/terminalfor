interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  className?: string
}

/** Компактный SVG-график динамики без осей — для строк вотчлиста, шапки портфеля и т.п. */
export function Sparkline({ values, width = 64, height = 24, className = '' }: SparklineProps) {
  if (values.length < 2) {
    return <div style={{ width, height }} className={className} />
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const positive = values[values.length - 1] >= values[0]

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const areaPoints = `0,${height} ${points} ${width},${height}`
  const color = positive ? 'var(--buy)' : 'var(--sell)'

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={className} preserveAspectRatio="none">
      <polygon points={areaPoints} fill={color} fillOpacity="0.12" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
