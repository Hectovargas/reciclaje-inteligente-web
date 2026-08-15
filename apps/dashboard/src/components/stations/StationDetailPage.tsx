import { useState } from 'react'
import { Station, getStatusConfig, getStationZoneName, fetchWithAuth } from '../../config/api'
import { TokenDisplay } from './TokenDisplay'
import { EditStationModal } from './EditStationModal'

interface StationDetailPageProps {
  station: Station
  onClose: () => void
  onRevoke?: (id: string, newTokens?: { token: string; provisioningToken?: string }) => void
  onUpdate?: (updated: Station) => void
  onDelete?: (id: string) => void
}

export function StationDetailPage({
  station: initialStation,
  onClose,
  onRevoke,
  onUpdate,
  onDelete,
}: StationDetailPageProps) {
  const [station, setStation] = useState<Station>(initialStation)
  const [currentToken, setCurrentToken] = useState(station.token)
  const [currentProvToken, setCurrentProvToken] = useState(station.provisioningToken || '')
  const [revoking, setRevoking] = useState(false)
  const [revokeSuccessMsg, setRevokeSuccessMsg] = useState<string | null>(null)
  const [revokeError, setRevokeError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const s = getStatusConfig(station.status)
  const zoneName = getStationZoneName(station)

  const handleRevokeClick = async () => {
    setRevoking(true)
    setRevokeError(null)
    setRevokeSuccessMsg(null)
    try {
      const res = await fetchWithAuth(`/estaciones/${station.id}/revoke-token`, {
        method: 'POST'
      })

      const newToken = res.token
      const newProvToken = res.provisioningToken || ''

      setCurrentToken(newToken)
      setCurrentProvToken(newProvToken)
      setStation(prev => ({
        ...prev,
        token: newToken,
        provisioningToken: newProvToken
      }))

      setRevokeSuccessMsg('Token revocado y regenerado exitosamente en el servidor.')
      setTimeout(() => setRevokeSuccessMsg(null), 5000)

      if (onRevoke) {
        onRevoke(station.id, { token: newToken, provisioningToken: newProvToken })
      }
    } catch (err: any) {
      setRevokeError(err?.message || 'Error al revocar el token en el servidor')
    } finally {
      setRevoking(false)
    }
  }

  const handleStationUpdated = (updated: Station) => {
    setStation(updated)
    setCurrentToken(updated.token)
    if (updated.provisioningToken) setCurrentProvToken(updated.provisioningToken)
    if (onUpdate) onUpdate(updated)
  }

  const handleStationDeleted = (id: string) => {
    if (onDelete) onDelete(id)
    onClose()
  }

  // Telemetry levels (paper, plastic, metal)
  const lastTelem = station.lastTelemetry || (station.telemetrias && station.telemetrias[0])
  const papelLevel = lastTelem ? lastTelem.nivelPapel : Math.min(100, Math.round(station.capacity * 0.45))
  const plasticoLevel = lastTelem ? lastTelem.nivelPlastico : Math.min(100, Math.round(station.capacity * 0.35))
  const metalLevel = lastTelem ? lastTelem.nivelMetal : Math.min(100, Math.round(station.capacity * 0.20))
  const avgLevel = Math.round((papelLevel + plasticoLevel + metalLevel) / 3)

  // Estimated collection time
  const estHours = Math.max(1, Math.round((100 - avgLevel) / 8))
  const estMinutes = (avgLevel * 7) % 60

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24, minHeight: '100%' }}>
      {showEditModal && (
        <EditStationModal
          station={station}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleStationUpdated}
          onDelete={handleStationDeleted}
        />
      )}

      {/* Top Navigation */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button
            onClick={onClose}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '7px 16px', borderRadius: 99,
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
            Volver
          </button>

          <button
            onClick={() => setShowEditModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '7px 18px', borderRadius: 99,
              background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)',
              color: '#22d3ee', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.08)' }}
          >
            ⚙ Configurar / Editar
          </button>
        </div>

        {/* Station Title & Status Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%', background: s.color,
                boxShadow: `0 0 14px ${s.color}`,
              }} />
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: '#f0fdf4' }}>
                {station.name}
              </h1>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(240,253,244,0.5)',
                padding: '3px 8px', borderRadius: 6, background: 'rgba(240,253,244,0.06)',
              }}>
                {station.id}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 13, color: 'rgba(240,253,244,0.45)' }}>
              <span>Zona: <strong style={{ color: '#a3e635' }}>{zoneName}</strong></span>
              <span>·</span>
              <span>Ubicación: <span style={{ color: '#f0fdf4', fontWeight: 600 }}>{station.location}</span></span>
              {station.macAddress && (
                <>
                  <span>·</span>
                  <span>MAC: <code style={{ color: '#22d3ee', fontFamily: 'var(--font-mono)' }}>{station.macAddress}</code></span>
                </>
              )}
            </div>
          </div>

          <div style={{
            padding: '7px 16px', borderRadius: 99,
            background: s.badgeBg, border: `1px solid ${s.color}50`,
            fontSize: 12.5, fontWeight: 700, color: s.color, letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: s.color,
              animation: (station.status === 'ACTIVE' || station.status === 'active') ? 'pulse-dot 1.8s infinite' : 'none'
            }} />
            {s.label}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Nivel General de Llenado */}
        <div className="glass-card" style={{ padding: 20 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Nivel de Llenado Promedio
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 800, color: avgLevel >= 80 ? '#fbbf24' : '#34d399', textShadow: '0 0 16px rgba(52,211,153,0.4)', marginTop: 8 }}>
            {avgLevel}%
          </div>
          <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.4)', marginTop: 4 }}>
            Capacidad: {station.capacity} unidades
          </div>
        </div>

        {/* Vaciado Aproximado */}
        <div className="glass-card" style={{ padding: 20 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Vaciado aproximado
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 800, color: '#22d3ee', textShadow: '0 0 16px rgba(34,211,238,0.4)', marginTop: 8 }}>
            {(station.status === 'OFFLINE' || station.status === 'offline') ? 'N/A' : `~${estHours}h ${estMinutes > 0 ? `${estMinutes}m` : ''}`}
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
            {(station.today || 0).toLocaleString('es-ES')}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.4)', marginTop: 4 }}>
            artículos procesados por IA
          </div>
        </div>

        {/* Telemetría Hardware */}
        <div className="glass-card" style={{ padding: 20 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Estado Hardware IoT
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: station.lastPingAt ? '#34d399' : '#38bdf8', marginTop: 8 }}>
            {station.lastPingAt ? 'Conectado (Ping OK)' : (station.macAddress ? 'Esperando Ping' : 'Modo Standalone')}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.4)', marginTop: 4 }}>
            {station.lastPingAt ? `Último: ${new Date(station.lastPingAt).toLocaleTimeString('es-ES')}` : 'Sin telemetría reciente'}
          </div>
        </div>
      </div>

      {/* Main Content Rows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Left Column: Compartment Fill Levels & Telemetry */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,253,244,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Niveles de Compartimento ultrasónicos (IoT)
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a3e635' }}>
              {lastTelem ? 'Telemetría en tiempo real' : 'Estimación por eventos'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Compartimento Papel', val: papelLevel, color: '#a3e635' },
              { label: 'Compartimento Plástico', val: plasticoLevel, color: '#22d3ee' },
              { label: 'Compartimento Metal', val: metalLevel, color: '#a78bfa' },
            ].map(m => {
              const isAlert = m.val >= 80
              const barColor = isAlert ? '#fbbf24' : m.color
              return (
                <div key={m.label} style={{ padding: 14, borderRadius: 12, background: 'rgba(11,16,26,0.5)', border: `1px solid ${barColor}25` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#f0fdf4', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: barColor, boxShadow: `0 0 8px ${barColor}` }} />
                      {m.label}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: barColor }}>
                      {m.val}% {isAlert && <span style={{ fontSize: 10, color: '#fbbf24', marginLeft: 4 }}>⚠ Lleno</span>}
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(240,253,244,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, width: `${Math.min(100, m.val)}%`, background: barColor, boxShadow: `0 0 10px ${barColor}55`, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Security & Token Control */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,253,244,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Credenciales y Aprovisionamiento IoT
            </span>
          </div>

          {revokeSuccessMsg && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', fontSize: 12, fontWeight: 600 }}>
              {revokeSuccessMsg}
            </div>
          )}

          {revokeError && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 12, fontWeight: 600 }}>
              {revokeError}
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, color: 'rgba(240,253,244,0.6)', fontWeight: 600 }}>Token de Autenticación IoT (Runtime)</label>
            <TokenDisplay token={currentToken} />
          </div>

          {currentProvToken && (
            <div>
              <label style={{ fontSize: 11, color: 'rgba(240,253,244,0.6)', fontWeight: 600 }}>Token de Aprovisionamiento (Zero-Touch)</label>
              <TokenDisplay token={currentProvToken} />
            </div>
          )}

          <div style={{ paddingTop: 16, borderTop: '1px solid rgba(99,231,182,0.08)' }}>
            <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.4)', marginBottom: 12 }}>
              Al revocar los tokens, se invalidará la sesión actual en el backend (PostgreSQL) y se generarán nuevas credenciales criptográficas para reconfigurar el ESP32.
            </div>
            <button
              onClick={handleRevokeClick}
              disabled={revoking}
              style={{
                width: '100%', padding: '11px 0',
                border: '1px solid rgba(239,68,68,0.35)',
                borderRadius: 10, background: 'rgba(239,68,68,0.08)',
                color: '#ef4444', fontSize: 13, fontWeight: 700,
                cursor: revoking ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (!revoking) {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.18)'
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(239,68,68,0.25)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {revoking ? 'Revocando en Backend...' : 'Revocar y Regenerar Tokens (POST /estaciones/:id/revoke-token)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
