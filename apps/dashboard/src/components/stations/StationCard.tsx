import { Station, STATUS_CONFIG } from '../../config/api'

export function StationCard({ station, onClick }: { station: Station; onClick: () => void }) {
  const s = STATUS_CONFIG[station.status]

  return (
    <div
      className={`glass-card ${s.ring}`}
      style={{
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}
      onClick={onClick}
    >
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: s.color,
              boxShadow: `0 0 10px ${s.color}80`,
            }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: s.color, fontWeight: 600 }}>
              {station.id}
            </span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f0fdf4', marginTop: 6 }}>{station.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.4)', marginTop: 2 }}>{station.location}</div>
        </div>
        <div style={{
          padding: '4px 10px', borderRadius: 99,
          background: `${s.color}18`,
          border: `1px solid ${s.color}40`,
          fontSize: 10, fontWeight: 700, color: s.color,
          letterSpacing: '0.06em',
        }}>
          {s.label}
        </div>
      </div>

      {/* Vaciado aproximado */}
      {station.status !== 'offline' ? (() => {
        const estHours = Math.max(1, Math.round((100 - station.capacity) / 8))
        const estMinutes = (station.capacity * 7) % 60
        return (
          <div style={{
            marginTop: 16,
            padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(34,211,238,0.05)',
            border: '1px solid rgba(34,211,238,0.15)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ flex: '1 1 120px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Vaciado aproximado
              </div>
              <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.6)', marginTop: 2 }}>
                Próxima recolección estimada
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800, color: '#22d3ee', textShadow: '0 0 12px rgba(34,211,238,0.4)' }}>
              ~{estHours}h {estMinutes > 0 ? `${estMinutes}m` : ''}
            </div>
          </div>
        )
      })() : (
        <div style={{
          marginTop: 16,
          padding: '12px 14px',
          borderRadius: 10,
          background: 'rgba(239,68,68,0.05)',
          border: '1px solid rgba(239,68,68,0.15)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ flex: '1 1 120px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(239,68,68,0.6)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Vaciado aproximado
            </div>
            <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.4)', marginTop: 2 }}>
              Estación sin conexión
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: '#ef4444' }}>
            N/A
          </div>
        </div>
      )}

      {/* Material Breakdown */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(99,231,182,0.08)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ flex: '1 1 120px', fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Desglose por Material Hoy
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: '#22d3ee', whiteSpace: 'nowrap' }}>
            {station.today.toLocaleString('es-ES')} artículos
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: 6 }}>
          {[
            { label: 'Papel', count: Math.round(station.today * 0.45), color: '#a3e635' },
            { label: 'Plástico', count: Math.round(station.today * 0.35), color: '#22d3ee' },
            { label: 'Metal', count: Math.round(station.today * 0.20), color: '#a78bfa' },
          ].map(m => (
            <div key={m.label} style={{
              padding: '6px 8px', borderRadius: 8,
              background: 'rgba(11,16,26,0.5)', border: `1px solid ${m.color}25`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <span style={{ fontSize: 9, color: 'rgba(240,253,244,0.45)', fontWeight: 600 }}>{m.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: m.color }}>
                {m.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#22d3ee', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          Ver detalles completos →
        </span>
      </div>
    </div>
  )
}
