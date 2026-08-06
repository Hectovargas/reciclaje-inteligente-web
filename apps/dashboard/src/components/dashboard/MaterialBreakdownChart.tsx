import { useState } from 'react'
import { DATA, SERIES, MONTHS, MAX_VAL, Y_TICKS } from '../../mocks/data'

export function MaterialBreakdownChart() {
  const [activeSeries, setActiveSeries] = useState<string | null>(null)

  // Calculate totals per material
  const totals = {
    paper: DATA.paper.reduce((a, b) => a + b, 0),
    plastic: DATA.plastic.reduce((a, b) => a + b, 0),
    metal: DATA.metal.reduce((a, b) => a + b, 0),
  }
  const grandTotal = totals.paper + totals.plastic + totals.metal

  const W = 700, H = 200
  const PAD = { top: 20, right: 12, bottom: 28, left: 40 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom
  const stepX = cW / (MONTHS.length - 1)

  // Helper to generate SVG smooth line path
  const getPath = (values: number[]) => {
    const pts = values.map((v, i) => ({
      x: PAD.left + i * stepX,
      y: PAD.top + cH - (v / MAX_VAL) * cH,
    }))
    let path = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) / 3
      const cp2x = pts[i].x - (pts[i].x - pts[i - 1].x) / 3
      path += ` C ${cp1x} ${pts[i - 1].y} ${cp2x} ${pts[i].y} ${pts[i].x} ${pts[i].y}`
    }
    return { path, pts }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header & Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f0fdf4' }}>
            Clasificación de Elementos por Material
          </span>
          <span style={{ marginLeft: 10, fontSize: 10, color: 'rgba(240,253,244,0.35)', fontFamily: 'var(--font-mono)' }}>
            desglose total y tendencia mensual
          </span>
        </div>

        {/* Material Summary Pills */}
        <div style={{ display: 'flex', gap: 8 }}>
          {SERIES.map(s => {
            const count = totals[s.key]
            const pct = ((count / grandTotal) * 100).toFixed(1)
            const isHovered = activeSeries === s.key
            return (
              <button
                key={s.key}
                onClick={() => setActiveSeries(activeSeries === s.key ? null : s.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px', borderRadius: 10, border: `1px solid ${isHovered ? s.color : `${s.color}35`}`,
                  background: isHovered ? `${s.color}20` : `${s.color}0a`,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
                  boxShadow: isHovered ? `0 0 16px ${s.color}40` : 'none',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#f0fdf4' }}>{s.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: s.color }}>
                  {count.toLocaleString('es-ES')} <span style={{ fontSize: 9.5, opacity: 0.7 }}>({pct}%)</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* SVG Multi-series Line Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 210, overflow: 'hidden' }}>
        <defs>
          {SERIES.map(s => (
            <filter key={s.key} id={`glow-${s.key}`}>
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        {/* Y Grid */}
        {Y_TICKS.map(v => {
          const y = PAD.top + cH - (v / MAX_VAL) * cH
          return (
            <g key={v}>
              <line x1={PAD.left} y1={y} x2={PAD.left + cW} y2={y} stroke="rgba(240,253,244,0.05)" strokeWidth={1} />
              <text x={PAD.left - 6} y={y + 3.5} textAnchor="end" fill="rgba(240,253,244,0.28)" fontSize={8.5} fontFamily="var(--font-mono)">
                {v}
              </text>
            </g>
          )
        })}

        {/* Series Lines */}
        {SERIES.map(s => {
          const isDimmed = activeSeries !== null && activeSeries !== s.key
          const { path, pts } = getPath(DATA[s.key])
          return (
            <g key={s.key} style={{ opacity: isDimmed ? 0.2 : 1, transition: 'opacity 0.3s' }}>
              <path d={path} fill="none" stroke={s.color} strokeWidth={activeSeries === s.key ? 3 : 2} filter={`url(#glow-${s.key})`} strokeLinecap="round" />
              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x} cy={p.y} r={activeSeries === s.key ? 4 : 2.5}
                  fill={s.color} stroke="rgba(11,16,26,0.9)" strokeWidth={1.5}
                />
              ))}
            </g>
          )
        })}

        {/* X Axis Month Labels */}
        {MONTHS.map((m, i) => (
          <text
            key={m}
            x={PAD.left + i * stepX}
            y={PAD.top + cH + 16}
            textAnchor="middle"
            fill="rgba(240,253,244,0.35)"
            fontSize={8.5}
            fontFamily="var(--font-mono)"
          >
            {m}
          </text>
        ))}

        {/* Axis border */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + cH} stroke="rgba(240,253,244,0.07)" strokeWidth={1} />
      </svg>
    </div>
  )
}
