import { useState } from 'react'
import { Station, STATUS_CONFIG } from '../../mocks/data'
import { TokenDisplay } from './TokenDisplay'

export function StationCard({ station, onRevoke }: { station: Station; onRevoke: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const s = STATUS_CONFIG[station.status]

  return (
    <div
      className={`glass-card ${s.ring}`}
      style={{
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}
      onClick={() => setExpanded(!expanded)}
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

      {/* Fill forecast bar */}
      {station.status !== 'offline' && (() => {
        const ratePerHour = station.today / 24
        const projected = Math.min(100, Math.round(station.capacity + ratePerHour * 5))
        const color = projected > 90 ? '#ef4444' : projected > 75 ? '#fbbf24' : '#34d399'
        return (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 10.5, color: 'rgba(240,253,244,0.4)' }}>Llenado aprox. en 5h</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color, fontWeight: 700 }}>
                {projected}%
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(240,253,244,0.07)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, width: `${station.capacity}%`, background: 'rgba(240,253,244,0.15)', transition: 'width 0.8s ease', position: 'relative' }}>
              </div>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(240,253,244,0.04)', overflow: 'hidden', marginTop: 2 }}>
              <div style={{ height: '100%', borderRadius: 2, width: `${projected}%`, background: color, boxShadow: `0 0 8px ${color}55`, transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
              <span style={{ fontSize: 9, color: 'rgba(240,253,244,0.25)', fontFamily: 'var(--font-mono)' }}>ahora {station.capacity}%</span>
              <span style={{ fontSize: 9, color: 'rgba(240,253,244,0.25)', fontFamily: 'var(--font-mono)' }}>+5h proyectado</span>
            </div>
          </div>
        )
      })()}

      <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#22d3ee', fontFamily: 'var(--font-sans)', letterSpacing: '-0.03em', textShadow: '0 0 16px rgba(34,211,238,0.4)' }}>
            {station.today.toLocaleString('es-ES')}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(240,253,244,0.35)', marginTop: 2 }}>clasificaciones hoy</div>
        </div>
      </div>

      {/* Expanded mini-dashboard */}
      {expanded && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid rgba(99,231,182,0.1)',
          }}
        >
          <TokenDisplay token={station.token} />

          <button
            onClick={() => onRevoke(station.id)}
            style={{
              marginTop: 12, width: '100%', padding: '8px 0',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, background: 'rgba(239,68,68,0.06)',
              color: '#ef4444', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              const t = e.currentTarget
              t.style.background = 'rgba(239,68,68,0.12)'
              t.style.boxShadow = '0 0 16px rgba(239,68,68,0.2)'
            }}
            onMouseLeave={e => {
              const t = e.currentTarget
              t.style.background = 'rgba(239,68,68,0.06)'
              t.style.boxShadow = 'none'
            }}
          >
            Revocar token
          </button>
        </div>
      )}
    </div>
  )
}
