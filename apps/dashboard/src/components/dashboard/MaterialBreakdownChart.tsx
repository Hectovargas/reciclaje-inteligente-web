import { useMemo } from 'react'
import { SERIES, MONTHS, MAX_VAL, Y_TICKS, useApi } from '../../config/api'

export function MaterialBreakdownChart() {
  const { data: metrics } = useApi<any>('/dashboard/metrics')

  const chartData = metrics?.monthlyData || {
    paper: Array(12).fill(0),
    plastic: Array(12).fill(0),
    metal: Array(12).fill(0)
  }

  const totals = {
    paper: chartData.paper.reduce((a: number, b: number) => a + b, 0),
    plastic: chartData.plastic.reduce((a: number, b: number) => a + b, 0),
    metal: chartData.metal.reduce((a: number, b: number) => a + b, 0),
  }

  const W = 520, H = 220
  const PAD = { top: 24, right: 30, bottom: 24, left: 36 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom
  const stepX = cW / 11

  // Dynamic MAX based on data
  const dataMax = Math.max(
    ...chartData.paper,
    ...chartData.plastic,
    ...chartData.metal,
    0
  );
  // Ensure we don't divide by 0 and have a sensible max. Keep MAX_VAL minimum 10.
  const currentMax = dataMax > 0 ? Math.ceil(dataMax * 1.2) : 10;
  const currentYTicks = [0, currentMax * 0.25, currentMax * 0.5, currentMax * 0.75, currentMax];

  const getPath = (arr: number[]) => {
    const pts = arr.map((v, i) => ({
      x: PAD.left + i * stepX,
      y: PAD.top + cH - (v / currentMax) * cH
    }))
    let path = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const cp1x = pts[i-1].x + stepX / 3
      const cp2x = pts[i].x - stepX / 3
      path += ` C ${cp1x} ${pts[i-1].y} ${cp2x} ${pts[i].y} ${pts[i].x} ${pts[i].y}`
    }
    return { path, pts }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f0fdf4' }}>Composición de reciclaje</span>
          <span style={{ marginLeft: 10, fontSize: 10, color: 'rgba(240,253,244,0.35)', fontFamily: 'var(--font-mono)' }}>tendencia mensual</span>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {SERIES.map(s => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 10, color: 'rgba(240,253,244,0.5)', lineHeight: 1 }}>{s.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: s.color, fontFamily: 'var(--font-mono)' }}>
                  {totals[s.key]}u
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 'auto', aspectRatio: '520/220', overflow: 'visible', display: 'block' }}>
          <defs>
            <filter id="glow-lines">
              <feGaussianBlur stdDeviation="2.5" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Y Axis */}
          {currentYTicks.map((v, i) => {
            const y = PAD.top + cH - (v / currentMax) * cH
            return (
              <g key={`y-${i}`}>
                <line x1={PAD.left} y1={y} x2={PAD.left + cW} y2={y} stroke="rgba(240,253,244,0.06)" strokeWidth={1} />
                <text x={PAD.left - 6} y={y + 3.5} textAnchor="end" fill="rgba(240,253,244,0.3)" fontSize={9} fontFamily="var(--font-mono)">
                  {Math.round(v)}
                </text>
              </g>
            )
          })}

          {/* Lines & Points */}
          {SERIES.map(s => {
            const { path, pts } = getPath(chartData[s.key])
            return (
              <g key={s.key}>
                <path d={path} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-lines)" />
                {pts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={3} fill="#0b101a" stroke={s.color} strokeWidth={1.5} />
                ))}
              </g>
            )
          })}

          {/* X Axis */}
          {MONTHS.map((m, i) => (
            <text key={m} x={PAD.left + i * stepX} y={PAD.top + cH + 16} textAnchor="middle" fill="rgba(240,253,244,0.35)" fontSize={9.5} fontFamily="var(--font-mono)">
              {m}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}
