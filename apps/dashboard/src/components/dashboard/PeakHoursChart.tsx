import { useState, useMemo } from 'react'
import { PEAK_RANGES, useApi } from '../../config/api'

export function PeakHoursChart() {
  const [view, setView] = useState<'hoy' | 'semana'>('hoy')
  const { data: metrics } = useApi<any>('/dashboard/metrics')

  const PEAK_DATA = metrics?.peakData || { hoy: [], semana: [] }
  const data = PEAK_DATA[view] || []
  const MAX = 100

  const W = 700, H = 160
  const PAD = { top: 26, right: 28, bottom: 28, left: 36 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom
  const barW = cW / 24

  const Y_TICKS = [0, 25, 50, 75, 100]

  const pts = useMemo(() => data.map((v: number, i: number) => ({
    x: PAD.left + i * barW + barW / 2,
    y: PAD.top + cH - (v / MAX) * cH,
  })), [data, barW, cH, MAX])

  const { linePath, fillPath } = useMemo(() => {
    if (pts.length === 0) return { linePath: '', fillPath: '' }
    let path = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const cp1x = pts[i-1].x + (pts[i].x - pts[i-1].x) / 3
      const cp2x = pts[i].x - (pts[i].x - pts[i-1].x) / 3
      path += ` C ${cp1x} ${pts[i-1].y} ${cp2x} ${pts[i].y} ${pts[i].x} ${pts[i].y}`
    }
    return { 
      linePath: path, 
      fillPath: path + ` L ${pts[pts.length-1].x} ${PAD.top + cH} L ${pts[0].x} ${PAD.top + cH} Z` 
    }
  }, [pts])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f0fdf4' }}>Horas pico de uso</span>
          <span style={{ marginLeft: 10, fontSize: 10, color: 'rgba(240,253,244,0.35)', fontFamily: 'var(--font-mono)' }}>actividad por hora · red completa</span>
        </div>
        <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(99,231,182,0.14)', background: 'rgba(240,253,244,0.03)' }}>
          {(['hoy','semana'] as const).map(m => (
            <button key={m} onClick={() => setView(m)} style={{
              padding: '5px 14px', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
              background: view === m ? 'rgba(163,230,53,0.15)' : 'transparent',
              color: view === m ? '#a3e635' : 'rgba(240,253,244,0.4)',
              transition: 'all 0.18s',
              boxShadow: view === m ? 'inset 0 0 0 1px rgba(163,230,53,0.25)' : 'none',
            }}>
              {m === 'hoy' ? 'Hoy' : 'Prom. semanal'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%' }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 'auto', aspectRatio: '700/160', overflow: 'hidden', display: 'block' }}>
        <defs>
          <linearGradient id="pkgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a3e635" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#a3e635" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="pkline" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#a3e635" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {Y_TICKS.map(v => {
          const y = PAD.top + cH - (v / MAX) * cH
          return (
            <g key={v}>
              <line x1={PAD.left} y1={y} x2={PAD.left + cW} y2={y} stroke="rgba(240,253,244,0.05)" strokeWidth={1} />
              {v > 0 && (
                <text x={PAD.left - 5} y={y + 3.5} textAnchor="end" fill="rgba(240,253,244,0.28)" fontSize={8} fontFamily="var(--font-mono)">{v}</text>
              )}
            </g>
          )
        })}

        {PEAK_RANGES.map(r => {
          const x1 = PAD.left + r.start * barW
          const x2 = PAD.left + (r.end + 1) * barW
          const midX = (x1 + x2) / 2
          const peakVal = Math.max(...(data.slice(r.start, r.end + 1) || [0]))
          const labelY = PAD.top + cH - (peakVal / MAX) * cH - 8
          return (
            <g key={r.label}>
              <rect x={x1} y={PAD.top} width={x2 - x1} height={cH}
                fill="rgba(163,230,53,0.07)" rx={4} />
              <rect x={x1} y={PAD.top} width={x2 - x1} height={1}
                fill="rgba(163,230,53,0.35)" />
              <text x={midX} y={labelY} textAnchor="middle"
                fill="#a3e635" fontSize={8} fontWeight="700" fontFamily="var(--font-mono)"
                style={{ filter: 'drop-shadow(0 0 4px rgba(163,230,53,0.6))' }}>
                {r.label}
              </text>
            </g>
          )
        })}

        <path d={fillPath} fill="url(#pkgrad)" />
        <path d={linePath} fill="none" stroke="url(#pkline)" strokeWidth={2} filter="url(#glow)" strokeLinecap="round" />

        {PEAK_RANGES.flatMap(r =>
          data.slice(r.start, r.end + 1).map((v: number, i: number) => {
            const idx = r.start + i
            return (
              <circle key={`${r.start}-${i}`}
                cx={pts[idx].x} cy={pts[idx].y} r={3}
                fill="#a3e635" stroke="rgba(11,16,26,0.8)" strokeWidth={1.5}
                style={{ filter: 'drop-shadow(0 0 5px rgba(163,230,53,0.8))' }}
              />
            )
          })
        )}

        {/* X axis hour labels — every 3h + 23h */}
        {[0, 3, 6, 9, 12, 15, 18, 21, 23].map(h => (
          <text key={h}
            x={PAD.left + h * barW + barW / 2}
            y={PAD.top + cH + 14}
            textAnchor="middle"
            fill="rgba(240,253,244,0.3)"
            fontSize={8.5}
            fontFamily="var(--font-mono)"
          >{h}h</text>
        ))}

        {/* Axis line */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + cH} stroke="rgba(240,253,244,0.07)" strokeWidth={1} />
      </svg>
      </div>
    </div>
  )
}
