import { useState } from 'react'
import { Station, INITIAL_STATIONS } from '../mocks/data'
import { StationCard } from './stations/StationCard'
import { AddStationModal } from './stations/AddStationModal'

export default function Stations() {
  const [stations, setStations] = useState<Station[]>(INITIAL_STATIONS)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'offline' | 'warning'>('all')

  const filtered = filter === 'all' ? stations : stations.filter(s => s.status === filter)

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

  return (
    <div style={{ padding: '32px 28px' }}>
      {showModal && <AddStationModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', margin: 0, color: '#f0fdf4' }}>
            Gestión de Estaciones
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(240,253,244,0.4)' }}>
            {stations.length} estaciones registradas en la red
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

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
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

      {/* Station grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {filtered.map(s => (
          <StationCard key={s.id} station={s} onRevoke={handleRevoke} />
        ))}
      </div>
    </div>
  )
}
