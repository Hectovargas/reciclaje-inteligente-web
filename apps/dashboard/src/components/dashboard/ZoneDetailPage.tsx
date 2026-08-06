import { ZONES } from '../../mocks/data'
import { StationCard } from './StationCard'

export function ZoneDetailPage({ zone, onClose }: { zone: typeof ZONES[0]; onClose: () => void }) {
  const zc = zone.value > 85 ? '#a3e635' : zone.value > 65 ? '#22d3ee' : '#a78bfa'
  const activeCount = zone.stations.filter(s => s.status === 'active').length
  const avgFill = Math.round(zone.stations.reduce((a, s) => a + s.fill, 0) / zone.stations.length)

  return (
    <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: '100%' }}>

      {/* Back + header */}
      <div>
        <button
          onClick={onClose}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 14px', borderRadius: 99, marginBottom: 20,
            background: 'rgba(240,253,244,0.04)', border: '1px solid rgba(99,231,182,0.14)',
            color: 'rgba(240,253,244,0.55)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f0fdf4'; e.currentTarget.style.borderColor = 'rgba(99,231,182,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,253,244,0.55)'; e.currentTarget.style.borderColor = 'rgba(99,231,182,0.14)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver al dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: zc, boxShadow: `0 0 14px ${zc}` }} />
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: '#f0fdf4' }}>Zona {zone.name}</h1>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(240,253,244,0.38)' }}>
              {zone.stations.length} estaciones · {activeCount} activas · métricas en tiempo real
            </p>
          </div>

          {/* Zone summary pills */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Eficiencia global', value: `${zone.value}%`, color: zc },
              { label: 'Llenado promedio', value: `${avgFill}%`, color: avgFill > 75 ? '#ef4444' : '#34d399' },
              { label: 'Estaciones activas', value: `${activeCount}/${zone.stations.length}`, color: '#22d3ee' },
            ].map(p => (
              <div key={p.label} style={{
                padding: '10px 18px', borderRadius: 12,
                background: `${p.color}0f`, border: `1px solid ${p.color}28`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: p.color, textShadow: `0 0 16px ${p.color}55` }}>{p.value}</span>
                <span style={{ fontSize: 9.5, color: 'rgba(240,253,244,0.35)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Station cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {zone.stations.map(s => (
          <StationCard key={s.id} s={s} zc={zc} />
        ))}
      </div>
    </div>
  )
}
