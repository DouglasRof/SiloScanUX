import { useMemo } from 'react'
import type { HistorySample } from '../../types/silo'

interface HistoryChartProps {
  history: HistorySample[]
  windowMs?: number
  width?: number
  height?: number
}

export function HistoryChart({ history, windowMs = 24 * 3_600_000, width = 260, height = 56 }: HistoryChartProps) {
  const { path, areaPath, lastPoint } = useMemo(() => {
    const newestT = history.length > 0 ? history[history.length - 1].t : Date.now()
    const windowStart = newestT - windowMs
    const samples = history.filter((h) => h.t >= windowStart)
    const data = samples.length >= 2 ? samples : history.slice(-2)
    if (data.length < 2) return { path: '', areaPath: '', lastPoint: null }

    const t0 = data[0].t
    const t1 = data[data.length - 1].t
    const span = Math.max(1, t1 - t0)
    const pad = 6

    const pts = data.map((d) => {
      const x = pad + ((d.t - t0) / span) * (width - pad * 2)
      const y = height - pad - (d.levelPercent / 100) * (height - pad * 2)
      return [x, y] as const
    })

    const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
    const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${height} L ${pts[0][0].toFixed(1)} ${height} Z`
    return { path: line, areaPath: area, lastPoint: pts[pts.length - 1] }
  }, [history, windowMs, width, height])

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-14 w-full overflow-visible">
      <defs>
        <linearGradient id="historyFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-navy)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-navy)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath && <path d={areaPath} fill="url(#historyFill)" />}
      {path && <path d={path} fill="none" stroke="var(--color-navy)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
      {lastPoint && <circle cx={lastPoint[0]} cy={lastPoint[1]} r="3" fill="var(--color-navy)" />}
    </svg>
  )
}
