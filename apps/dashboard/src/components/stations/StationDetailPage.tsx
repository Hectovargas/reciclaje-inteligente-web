import { useState } from 'react'
import { Station, STATUS_CONFIG } from '../../mocks/data'
import { TokenDisplay } from './TokenDisplay'

export function StationDetailPage({
  station,
  onClose,
  onRevoke,
}: {
  station: Station
  onClose: () => void
  onRevoke: (id: string) => void
}) {
  const [currentToken, setCurrentToken] = useState(station.token)
  const s = STATUS_CONFIG[station.status]

  const handleRevokeClick = () => {
    const newToken = 'tk_' + Math.random().toString(36).slice(2, 14)
    setCurrentToken(newToken)
    onRevoke(station.id)
  }

  // Material breakdown calculations for this station
  const paperCount = Math.round(station.today * 0.45)
  const plasticCount = Math.round(station.today * 0.35)
  const metalCount = Math.round(station.today * 0.20)
  const totalCount = paperCount + plasticCount + metalCount || 1

  const estHours = Math.max(1, Math.round((100 - station.capacity) / 8))
  const estMinutes = (station.capacity * 7) % 60

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24, minHeight: '100%' }}>
      {/* Top Navigation */}
      <div>
        <button
          onClick={onClose}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 16px', borderRadius: 99, marginBottom: 20,
            background: 'rgba(240,253,244,0.04)', border: '1px solid rgba(99,231,182,0.14)',
            color: 'rgba(240,253,244,0.7)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f0fdf4'; e.currentTarget.style.borderColor = 'rgba(99,231,182,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,253,244,0.7)'; e.currentTarget.style.borderColor = 'rgba(99,231,182,0.14)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver a Estaciones
        </button>

        {/* Station Title & Status Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%', background: s.color,
                boxShadow: `0 0 14px ${s.color}`,
              }} />
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: '#f0fdf4' }}>
                {station.name}
              </h1>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(240,253,244,0.4)',
                padding: '3px 8px', borderRadius: 6, background: 'rgba(240,253,244,0.05)',
              }}>
                {station.id}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(240,253,244,0.45)' }}>
              Ubicación: <span style={{ color: '#f0fdf4', fontWeight: 600 }}>{station.location}</span>
            </p>
          </div>

          <div style={{
            padding: '6px 14px', borderRadius: 99,
            background: `${s.color}18`, border: `1px solid ${s.color}40`,
            fontSize: 12, fontWeight: 700, color: s.color, letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, animation: station.status === 'active' ? 'pulse-dot 1.8s infinite' : 'none' }} />
            {s.label}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Vaciado Aproximado */}
        <div className="glass-card" style={{ padding: 20 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Vaciado aproximado
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 800, color: '#22d3ee', textShadow: '0 0 16px rgba(34,211,238,0.4)', marginTop: 8 }}>
            {station.status === 'offline' ? 'N/A' : `~${estHours}h ${estMinutes > 0 ? `${estMinutes}m` : ''}`}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.4)', marginTop: 4 }}>
            Próxima recolección estimada
          </div>
        </div>

        {/* Clasificaciones Hoy */}
        <div className="glass-card" style={{ padding: 20 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Clasificaciones hoy
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 800, color: '#a3e635', textShadow: '0 0 16px rgba(163,230,53,0.4)', marginTop: 8 }}>
            {station.today.toLocaleString('es-ES')}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.4)', marginTop: 4 }}>
            artículos procesados correctamente
          </div>
        </div>


      </div>

      {/* Main Content Rows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Left Column: Material Breakdown */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,253,244,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Desglose de Clasificación por Material
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a3e635' }}>
              Total: {station.today.toLocaleString('es-ES')} artículos
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Papel y Cartón', count: paperCount, color: '#a3e635' },
              { label: 'Plásticos (PET/PEAD)', count: plasticCount, color: '#22d3ee' },
              { label: 'Metales y Aluminio', count: metalCount, color: '#a78bfa' },
            ].map(m => {
              const pct = ((m.count / totalCount) * 100).toFixed(1)
              return (
                <div key={m.label} style={{ padding: 14, borderRadius: 12, background: 'rgba(11,16,26,0.5)', border: `1px solid ${m.color}20` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#f0fdf4', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, boxShadow: `0 0 8px ${m.color}` }} />
                      {m.label}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: m.color }}>
                      {m.count.toLocaleString('es-ES')} <span style={{ fontSize: 10, opacity: 0.6 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(240,253,244,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: m.color, boxShadow: `0 0 10px ${m.color}55` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Security & Token Control */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,253,244,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Control de Conexión y Seguridad
          </span>

          <div>
            <label style={{ fontSize: 11, color: 'rgba(240,253,244,0.4)', fontWeight: 600 }}>Token de Autenticación IoT</label>
            <TokenDisplay token={currentToken} />
          </div>

          <div style={{ paddingTop: 16, borderTop: '1px solid rgba(99,231,182,0.08)' }}>
            <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.4)', marginBottom: 12 }}>
              Al revocar el token se desconectará la estación hasta ingresar la nueva clave en el firmware.
            </div>
            <button
              onClick={handleRevokeClick}
              style={{
                width: '100%', padding: '11px 0',
                border: '1px solid rgba(239,68,68,0.35)',
                borderRadius: 10, background: 'rgba(239,68,68,0.08)',
                color: '#ef4444', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.18)'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(239,68,68,0.25)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              Revocar y Regenerar Token
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
