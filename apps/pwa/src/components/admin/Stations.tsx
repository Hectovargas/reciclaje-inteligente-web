'use client'
import { useState, useEffect } from 'react'
import { Station, getStationZoneName, useApi } from '@/config/api'
import { StationCard } from './StationCard'
import { AddStationModal } from './AddStationModal'
import { EditStationModal } from './EditStationModal'
import { StationDetailPage } from './StationDetailPage'

export default function Stations() {
  const { data: apiStations, loading, refetch } = useApi<Station[]>('/estaciones', { pollIntervalMs: 10000 })
  const { data: apiZones } = useApi<{ id: string; name: string }[]>('/zonas')
  const [stations, setStations] = useState<Station[]>([])

  useEffect(() => { if (apiStations) setStations(apiStations) }, [apiStations])

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStation, setEditingStation] = useState<Station | null>(null)
  const [filter, setFilter] = useState<'all' | 'ACTIVE' | 'WARNING' | 'PENDING_ACTIVATION' | 'OFFLINE'>('all')
  const [zoneFilter, setZoneFilter] = useState<string>('all')
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)

  const filtered = stations.filter(s => {
    const statusUpper = (s.status || '').toUpperCase()
    const matchesStatus = filter === 'all' || statusUpper === filter || s.status === filter.toLowerCase()
    const zoneName = getStationZoneName(s)
    const matchesZone = zoneFilter === 'all' || zoneName === zoneFilter || s.zoneId === zoneFilter
    return matchesStatus && matchesZone
  })

  const handleRevoke = (id: string, newTokens?: { token: string; provisioningToken?: string }) => {
    setStations(prev => prev.map(s => s.id === id ? { ...s, ...(newTokens || {}) } : s))
    if (selectedStation && selectedStation.id === id) setSelectedStation(prev => prev ? { ...prev, ...(newTokens || {}) } : null)
  }
  const handleAdd = (s: Station) => setStations(prev => [s, ...prev])
  const handleUpdate = (updated: Station) => {
    setStations(prev => prev.map(s => s.id === updated.id ? updated : s))
    if (selectedStation && selectedStation.id === updated.id) setSelectedStation(updated)
  }
  const handleDelete = (id: string) => {
    setStations(prev => prev.filter(s => s.id !== id))
    if (selectedStation && selectedStation.id === id) setSelectedStation(null)
  }

  const counts = {
    active: stations.filter(s => (s.status || '').toUpperCase() === 'ACTIVE').length,
    warning: stations.filter(s => (s.status || '').toUpperCase() === 'WARNING').length,
    pending: stations.filter(s => (s.status || '').toUpperCase() === 'PENDING_ACTIVATION').length,
    offline: stations.filter(s => (s.status || '').toUpperCase() === 'OFFLINE').length,
  }

  if (selectedStation) {
    const current = stations.find(s => s.id === selectedStation.id) || selectedStation
    return <StationDetailPage station={current} onClose={() => setSelectedStation(null)} onRevoke={handleRevoke} onUpdate={handleUpdate} onDelete={handleDelete} />
  }

  return (
    <div style={{ padding: '24px 16px' }}>
      {showAddModal && <AddStationModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />}
      {editingStation && <EditStationModal station={editingStation} onClose={() => setEditingStation(null)} onUpdate={handleUpdate} onDelete={handleDelete} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', margin: 0, color: '#f0fdf4' }}>Gestión de Estaciones IoT</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(240,253,244,0.45)' }}>{filtered.length} de {stations.length} estaciones en la red CleanCity · Telemetría y provisioning</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => refetch()} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(99,231,182,0.2)', background: 'rgba(240,253,244,0.05)', color: '#f0fdf4', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>↻ Actualizar</button>
          <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #a3e635, #22d3ee)', color: '#0d1117', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: '0 0 24px rgba(163,230,53,0.35)' }}>+ Agregar estación</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(['all', 'ACTIVE', 'WARNING', 'PENDING_ACTIVATION', 'OFFLINE'] as const).map((id) => {
            const labels: Record<string, string> = { all: 'Todas', ACTIVE: 'Activas', WARNING: 'Alerta Llenado', PENDING_ACTIVATION: 'Pendiente Activación', OFFLINE: 'Desconectadas' }
            const countMap: Record<string, number> = { all: stations.length, ACTIVE: counts.active, WARNING: counts.warning, PENDING_ACTIVATION: counts.pending, OFFLINE: counts.offline }
            const isSelected = filter === id
            return (
              <button key={id} onClick={() => setFilter(id)} style={{ padding: '7px 16px', borderRadius: 99, border: 'none', background: isSelected ? 'rgba(163,230,53,0.14)' : 'rgba(22,32,50,0.5)', color: isSelected ? '#a3e635' : 'rgba(240,253,244,0.45)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: isSelected ? 'inset 0 0 0 1px rgba(163,230,53,0.35)' : 'inset 0 0 0 1px rgba(99,231,182,0.08)', transition: 'all 0.2s' }}>
                {labels[id]} <span style={{ opacity: 0.6, marginLeft: 4 }}>({countMap[id]})</span>
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zona:</span>
          <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} style={{ padding: '7px 14px', borderRadius: 99, background: 'rgba(22,32,50,0.85)', border: '1px solid rgba(99,231,182,0.22)', color: zoneFilter === 'all' ? 'rgba(240,253,244,0.7)' : '#22d3ee', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', outline: 'none', colorScheme: 'dark' }}>
            <option value="all" style={{ background: '#0f1624' }}>Todas las zonas</option>
            {apiZones?.map(z => <option key={z.id} value={z.name} style={{ background: '#0f1624', color: '#f0fdf4' }}>{z.name}</option>)}
          </select>
        </div>
      </div>

      {loading && stations.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'rgba(240,253,244,0.5)' }}>Cargando estaciones de reciclaje...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'rgba(240,253,244,0.45)' }}>No hay estaciones que coincidan con los filtros seleccionados.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map(s => <StationCard key={s.id} station={s} onClick={() => setSelectedStation(s)} onEdit={st => setEditingStation(st)} />)}
        </div>
      )}
    </div>
  )
}
