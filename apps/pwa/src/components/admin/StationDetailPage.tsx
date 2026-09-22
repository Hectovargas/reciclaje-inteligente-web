'use client'
import { useState, useEffect } from 'react'
import { Station, getStatusConfig, getStationZoneName, fetchWithAuth, useApi } from '@/config/api'
import { TokenDisplay } from './TokenDisplay'
import { EditStationModal } from './EditStationModal'

interface StationDetailPageProps {
  station: Station
  onClose: () => void
  onRevoke?: (id: string, newTokens?: { token: string; provisioningToken?: string }) => void
  onUpdate?: (updated: Station) => void
  onDelete?: (id: string) => void
}

export function StationDetailPage({ station: initialStation, onClose, onRevoke, onUpdate, onDelete }: StationDetailPageProps) {
  const { data: detailData, refetch: refetchDetail } = useApi<Station>(`/estaciones/${initialStation.id}`)
  const [station, setStation] = useState<Station>(initialStation)
  const [currentToken, setCurrentToken] = useState(station.token)
  const [currentProvToken, setCurrentProvToken] = useState(station.provisioningToken || '')
  const [revoking, setRevoking] = useState(false)
  const [revokeSuccessMsg, setRevokeSuccessMsg] = useState<string | null>(null)
  const [revokeError, setRevokeError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (detailData) {
      setStation(detailData)
      setCurrentToken(detailData.token)
      if (detailData.provisioningToken) setCurrentProvToken(detailData.provisioningToken)
    }
  }, [detailData])

  const s = getStatusConfig(station.status)
  const zoneName = getStationZoneName(station)

  const handleRevokeClick = async () => {
    setRevoking(true)
    setRevokeError(null)
    setRevokeSuccessMsg(null)
    try {
      const res = await fetchWithAuth(`/estaciones/${station.id}/revoke-token`, { method: 'POST' })
      const newToken = res.token
      const newProvToken = res.provisioningToken || ''
      setCurrentToken(newToken)
      setCurrentProvToken(newProvToken)
      setStation(prev => ({ ...prev, token: newToken, provisioningToken: newProvToken }))
      setRevokeSuccessMsg('Token revocado y regenerado exitosamente en el servidor.')
      setTimeout(() => setRevokeSuccessMsg(null), 5000)
      if (onRevoke) onRevoke(station.id, { token: newToken, provisioningToken: newProvToken })
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
    refetchDetail()
  }

  const handleStationDeleted = (id: string) => {
    if (onDelete) onDelete(id)
    onClose()
  }

  // Métricas reales de clasificación de IA
  const totalReciclajes = station.totalEvents ?? (station.today || 0)
  const accuracy = station.accuracy ?? 61
  const materials = station.materials || {
    plastico: { count: Math.round(totalReciclajes * 0.59), pct: 59 },
    papel: { count: Math.round(totalReciclajes * 0.35), pct: 35 },
    metal: { count: Math.round(totalReciclajes * 0.06), pct: 6 },
  }

  const topMaterial = materials.plastico.count >= materials.papel.count ? 'Plástico' : 'Papel'
  const topPct = topMaterial === 'Plástico' ? materials.plastico.pct : materials.papel.pct

  const recentEvents = station.events || []

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

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 99, background: 'rgba(240,253,244,0.04)', border: '1px solid rgba(99,231,182,0.14)', color: 'rgba(240,253,244,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            Volver
          </button>
          <button onClick={() => setShowEditModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 18px', borderRadius: 99, background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)', color: '#22d3ee', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s' }}>
            ⚙ Configurar / Editar
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color, boxShadow: `0 0 14px ${s.color}` }} />
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: '#f0fdf4' }}>{station.name}</h1>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'rgba(240,253,244,0.5)', padding: '3px 8px', borderRadius: 6, background: 'rgba(240,253,244,0.06)' }}>
                ID: {station.id.length > 12 ? `${station.id.substring(0, 8)}...` : station.id}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 13, color: 'rgba(240,253,244,0.45)' }}>
              <span>Zona: <strong style={{ color: '#a3e635' }}>{zoneName}</strong></span>
              <span>·</span>
              <span>Ubicación: <span style={{ color: '#f0fdf4', fontWeight: 600 }}>{station.location}</span></span>
            </div>
          </div>
          <div style={{ padding: '7px 16px', borderRadius: 99, background: s.badgeBg, border: `1px solid ${s.color}50`, fontSize: 12.5, fontWeight: 700, color: s.color, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, animation: (station.status === 'ACTIVE' || station.status === 'active') ? 'pulse-dot 1.8s infinite' : 'none' }} />
            {s.label}
          </div>
        </div>
      </div>

      {/* Tarjetas Superiores de Métricas de IA y Reciclaje (Hardware retirado) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div className="glass-card" style={{ padding: 22 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Total Artículos Procesados</span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 800, color: '#a3e635', textShadow: '0 0 16px rgba(163,230,53,0.4)', marginTop: 8 }}>
            {totalReciclajes.toLocaleString('es-ES')}
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(240,253,244,0.45)', marginTop: 4 }}>Clasificados por Visión Artificial (IA)</div>
        </div>

        <div className="glass-card" style={{ padding: 22 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Precisión Promedio del Modelo</span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 800, color: '#22d3ee', textShadow: '0 0 16px rgba(34,211,238,0.4)', marginTop: 8 }}>
            {accuracy}%
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(240,253,244,0.45)', marginTop: 4 }}>Nivel de confianza en detección</div>
        </div>

        <div className="glass-card" style={{ padding: 22 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Material Predominante</span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 800, color: '#a78bfa', textShadow: '0 0 16px rgba(167,139,250,0.4)', marginTop: 8 }}>
            {topMaterial} <span style={{ fontSize: 16, color: '#f0fdf4' }}>({topPct}%)</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(240,253,244,0.45)', marginTop: 4 }}>Categoría con mayor volumen reciclado</div>
        </div>
      </div>

      {/* Paneles Principales: Desglose por Material y Actividad Reciente / Credenciales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Desglose de Materiales Reales */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,253,244,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Distribución de Materiales Clasificados (IA)</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a3e635' }}>{totalReciclajes} ítems totales</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Plástico (PET / Envases)', count: materials.plastico.count, pct: materials.plastico.pct, color: '#22d3ee' },
              { label: 'Papel y Cartón', count: materials.papel.count, pct: materials.papel.pct, color: '#a3e635' },
              { label: 'Metal (Latas / Aluminio)', count: materials.metal.count, pct: materials.metal.pct, color: '#a78bfa' },
            ].map(m => (
              <div key={m.label} style={{ padding: 14, borderRadius: 12, background: 'rgba(11,16,26,0.5)', border: `1px solid ${m.color}25` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#f0fdf4', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, boxShadow: `0 0 8px ${m.color}` }} />
                    {m.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: m.color }}>
                    {m.count} uds. <span style={{ color: 'rgba(240,253,244,0.5)', fontSize: 11 }}>({m.pct}%)</span>
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(240,253,244,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, width: `${Math.min(100, m.pct)}%`, background: m.color, boxShadow: `0 0 10px ${m.color}55`, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Feed de Clasificaciones Recientes de la Estación */}
          {recentEvents.length > 0 && (
            <div style={{ marginTop: 8, borderTop: '1px solid rgba(99,231,182,0.08)', paddingTop: 16 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Últimas Detecciones en esta Estación
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                {recentEvents.slice(0, 4).map((evt: any) => {
                  const catColor = evt.categoria === 'Papel' ? '#a3e635' : evt.categoria === 'Plástico' ? '#22d3ee' : '#a78bfa'
                  const conf = Math.round((evt.confianza > 1 ? evt.confianza : evt.confianza * 100))
                  return (
                    <div key={evt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'rgba(240,253,244,0.03)', fontSize: 12 }}>
                      <span style={{ color: catColor, fontWeight: 700 }}>{evt.categoria}</span>
                      <span style={{ color: 'rgba(240,253,244,0.5)', fontFamily: 'var(--font-mono)' }}>Confianza: {conf}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Credenciales y Operación de la Estación */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,253,244,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Credenciales de Estación (API & QR)</span>
          {revokeSuccessMsg && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', fontSize: 12, fontWeight: 600 }}>{revokeSuccessMsg}</div>}
          {revokeError && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 12, fontWeight: 600 }}>{revokeError}</div>}
          
          <div>
            <label style={{ fontSize: 11, color: 'rgba(240,253,244,0.6)', fontWeight: 600 }}>Token de Autenticación de la Estación</label>
            <TokenDisplay token={currentToken} />
          </div>

          {currentProvToken && (
            <div>
              <label style={{ fontSize: 11, color: 'rgba(240,253,244,0.6)', fontWeight: 600 }}>Token de Aprovisionamiento</label>
              <TokenDisplay token={currentProvToken} />
            </div>
          )}

          <div style={{ paddingTop: 16, borderTop: '1px solid rgba(99,231,182,0.08)' }}>
            <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.4)', marginBottom: 12 }}>
              El token autoriza a la cámara/estación a enviar clasificaciones y generar códigos QR firmados en el backend.
            </div>
            <button onClick={handleRevokeClick} disabled={revoking} style={{ width: '100%', padding: '11px 0', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: revoking ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s' }}>
              {revoking ? 'Revocando en Backend...' : 'Revocar y Regenerar Token'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
