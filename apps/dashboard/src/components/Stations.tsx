import { useState } from 'react'
import { Station, INITIAL_STATIONS, ZONAS } from '../mocks/data'
import { StationCard } from './stations/StationCard'
import { AddStationModal } from './stations/AddStationModal'
import { StationDetailPage } from './stations/StationDetailPage'

export default function Stations() {
  const [stations, setStations] = useState<Station[]>(INITIAL_STATIONS)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'offline' | 'warning'>('all')
  const [zoneFilter, setZoneFilter] = useState<string>('all')
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)

  const filtered = stations.filter(s => {
    const matchesStatus = filter === 'all' || s.status === filter
    const matchesZone = zoneFilter === 'all' || s.zone === zoneFilter
    return matchesStatus && matchesZone
  })

  const handleRevoke = (id: string) => {
    setStations(prev => prev.map(s => s.id === id
      ? { ...s, token: 'tk_' + Math.random().toString(36).slice(2, 14) }
      : s
    ))
  }

  const handleAdd = (s: Station) => {
    setStations(prev => [s, ...prev])
  }

  const counts = {
    active: stations.filter(s => s.status === 'active').length,
    offline: stations.filter(s => s.status === 'offline').length,
    warning: stations.filter(s => s.status === 'warning').length,
  }

  // If a station is selected, show detail view
  if (selectedStation) {
    const current = stations.find(s => s.id === selectedStation.id) || selectedStation
    return (
      <StationDetailPage
        station={current}
        onClose={() => setSelectedStation(null)}
        onRevoke={handleRevoke}
      />
    )
  }

  return (
    <div style={{ padding: '24px 16px' }}>
      {showModal && <AddStationModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', margin: 0, color: '#f0fdf4' }}>
            Gestión de Estaciones
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(240,253,244,0.4)' }}>
            {filtered.length} de {stations.length} estaciones mostradas
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #a3e635, #22d3ee)',
            color: '#0d1117', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            boxShadow: '0 0 24px rgba(163,230,53,0.35)',
            transition: 'box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 36px rgba(163,230,53,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(163,230,53,0.35)' }}
        >
          + Agregar estación
        </button>
      </div>

      {/* Filter controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        {/* Status filter tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {([['all', 'Todas', stations.length], ['active', 'Activas', counts.active], ['warning', 'Alerta', counts.warning], ['offline', 'Desconectadas', counts.offline]] as const).map(([id, label, count]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              style={{
                padding: '7px 16px', borderRadius: 99, border: 'none',
                background: filter === id ? 'rgba(163,230,53,0.12)' : 'rgba(22,32,50,0.5)',
                color: filter === id ? '#a3e635' : 'rgba(240,253,244,0.45)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                boxShadow: filter === id ? 'inset 0 0 0 1px rgba(163,230,53,0.3)' : 'inset 0 0 0 1px rgba(99,231,182,0.08)',
                transition: 'all 0.2s',
              }}
            >
              {label} <span style={{ opacity: 0.6 }}>{count}</span>
            </button>
          ))}
        </div>

        {/* Zone filter dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zona:</span>
          <select
            value={zoneFilter}
            onChange={e => setZoneFilter(e.target.value)}
            style={{
              padding: '7px 14px', borderRadius: 99,
              background: 'rgba(22,32,50,0.85)', border: '1px solid rgba(99,231,182,0.22)',
              color: zoneFilter === 'all' ? 'rgba(240,253,244,0.7)' : '#22d3ee',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-sans)', outline: 'none', colorScheme: 'dark',
              boxShadow: zoneFilter !== 'all' ? '0 0 12px rgba(34,211,238,0.2)' : 'none'
            }}
          >
            <option value="all" style={{ background: '#0f1624' }}>Todas las zonas</option>
            {ZONAS.map(z => (
              <option key={z} value={z} style={{ background: '#0f1624', color: '#f0fdf4' }}>{z}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Station grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: 16,
      }}>
        {filtered.map(s => (
          <StationCard key={s.id} station={s} onClick={() => setSelectedStation(s)} />
        ))}
      </div>
    </div>
  )
}
