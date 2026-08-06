import { ZONES, STATUS_DOT } from '../../mocks/data'

export function StationCard({ s, zc }: { s: typeof ZONES[0]['stations'][0]; zc: string }) {
  const sc = STATUS_DOT[s.status]
  const fillColor = s.fill > 85 ? '#ef4444' : s.fill > 70 ? '#fbbf24' : '#34d399'
  const statusLabel: Record<string, string> = { active: 'Activa', warning: 'Alerta', offline: 'Sin conexión' }

  // fake sparkline bars based on fill
  const bars = [0.4, 0.6, 0.5, 0.75, 0.65, 0.8, s.fill / 100].map((v, i) =>
    Math.round(v * 80 + Math.sin(i * 1.3) * 10)
  )

  const metrics = [
    { label: 'Artículos hoy',    value: Math.round(s.fill * 4.2).toLocaleString('es-ES'), unit: 'items' },
    { label: 'Precisión IA',     value: (92 + Math.round(s.fill / 20)).toString(),         unit: '%' },
    { label: 'Últ. vaciado',     value: `${Math.round((100 - s.fill) / 8)}h`,             unit: 'ago' },
    { label: 'Temp. sensor',     value: (18 + Math.round(s.fill / 15)).toString(),         unit: '°C' },
  ]

  return (
    <div style={{
      borderRadius: 16, background: 'rgba(240,253,244,0.025)',
      border: `1px solid ${zc}18`,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${zc}35` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${zc}18` }}
    >
      {/* Header */}
      <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(99,231,182,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc, boxShadow: `0 0 8px ${sc}90`, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f0fdf4', letterSpacing: '-0.02em' }}>{s.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(240,253,244,0.3)', marginTop: 1, fontFamily: 'var(--font-mono)' }}>{s.id}</div>
            </div>
          </div>
          <span style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: 99,
            background: `${sc}18`, color: sc, border: `1px solid ${sc}35`,
          }}>{statusLabel[s.status]}</span>
        </div>
      </div>

      {/* Fill bar section */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: 'rgba(240,253,244,0.38)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Nivel de llenado</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 800, color: fillColor, textShadow: `0 0 16px ${fillColor}60` }}>{s.fill}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(240,253,244,0.06)', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ height: '100%', borderRadius: 3, width: `${s.fill}%`, background: `linear-gradient(90deg, ${fillColor}99, ${fillColor})`, boxShadow: `0 0 10px ${fillColor}55`, transition: 'width 1s ease' }} />
        </div>

        {/* Sparkline */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36, marginBottom: 14 }}>
          {bars.map((h, i) => (
            <div key={i} style={{
              flex: 1, borderRadius: 3,
              height: `${h}%`,
              background: i === bars.length - 1
                ? `linear-gradient(180deg, ${zc}, ${zc}66)`
                : `rgba(240,253,244,0.08)`,
              boxShadow: i === bars.length - 1 ? `0 0 8px ${zc}50` : 'none',
              transition: 'height 0.8s ease',
            }} />
          ))}
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(99,231,182,0.05)', borderTop: '1px solid rgba(99,231,182,0.06)' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ padding: '12px 16px', background: 'rgba(11,16,26,0.4)' }}>
            <div style={{ fontSize: 9, color: 'rgba(240,253,244,0.3)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3 }}>{m.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: '#f0fdf4' }}>
              {m.value}<span style={{ fontSize: 10, color: 'rgba(240,253,244,0.35)', marginLeft: 2 }}>{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'rgba(240,253,244,0.25)', fontFamily: 'var(--font-mono)' }}>
          Último material: <span style={{ color: 'rgba(240,253,244,0.5)', fontWeight: 600 }}>{s.last}</span>
        </span>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d39990', animation: 'pulse 2s infinite' }} />
      </div>
    </div>
  )
}
