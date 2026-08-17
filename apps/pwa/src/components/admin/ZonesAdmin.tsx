'use client'
import { useState, useEffect } from 'react'
import { fetchWithAuth } from '@/config/api'

type ZoneItem = {
  id: string
  name: string
  isActive: boolean
  _count?: { stations: number }
}

export default function ZonesAdmin() {
  const [zones, setZones] = useState<ZoneItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingZone, setEditingZone] = useState<ZoneItem | null>(null)
  const [formName, setFormName] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formError, setFormError] = useState('')

  const loadZones = async () => {
    try {
      setLoading(true)
      const data = await fetchWithAuth('/zonas?includeInactive=true')
      setZones(data)
      setError('')
    } catch {
      setError('Error al cargar las zonas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadZones() }, [])

  const handleSave = async () => {
    setFormError('')
    if (!formName.trim()) { setFormError('El nombre es requerido'); return }
    try {
      if (editingZone) {
        await fetchWithAuth(`/zonas/${editingZone.id}`, { method: 'PATCH', body: JSON.stringify({ name: formName, isActive: formIsActive }) })
      } else {
        await fetchWithAuth('/zonas', { method: 'POST', body: JSON.stringify({ name: formName }) })
      }
      setShowModal(false)
      loadZones()
    } catch (err: any) {
      setFormError(err?.message || 'Error al guardar la zona')
    }
  }

  const openNew = () => { setEditingZone(null); setFormName(''); setFormIsActive(true); setFormError(''); setShowModal(true) }
  const openEdit = (z: ZoneItem) => { setEditingZone(z); setFormName(z.name); setFormIsActive(z.isActive); setFormError(''); setShowModal(true) }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: '#f0fdf4' }}>Gestión de Zonas</h1>
          <p style={{ margin: '4px 0 0', color: 'rgba(240,253,244,0.6)', fontSize: 14 }}>Administra las zonas disponibles para las estaciones.</p>
        </div>
        <button onClick={openNew} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #a3e635, #22d3ee)', color: '#0d1117', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, boxShadow: '0 0 20px rgba(163,230,53,0.3)' }}>
          + Nueva Zona
        </button>
      </div>

      {error && <div style={{ padding: 16, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 10, marginBottom: 24, border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}

      <div className="glass-card" style={{ padding: 24, borderRadius: 16 }}>
        {loading ? (
          <div style={{ color: 'rgba(240,253,244,0.5)', textAlign: 'center', padding: 40 }}>Cargando zonas...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  {['Nombre', 'Estado', 'Estaciones', 'Acciones'].map((h, i) => (
                    <th key={h} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(99,231,182,0.1)', color: 'rgba(240,253,244,0.4)', fontSize: 12, textTransform: 'uppercase', fontWeight: 700, textAlign: i === 3 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'rgba(240,253,244,0.4)' }}>No hay zonas registradas.</td></tr>
                ) : zones.map(z => (
                  <tr key={z.id} style={{ borderBottom: '1px solid rgba(99,231,182,0.05)' }}>
                    <td style={{ padding: '16px', color: '#f0fdf4', fontWeight: 600 }}>{z.name}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: z.isActive ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)', color: z.isActive ? '#34d399' : '#ef4444', border: `1px solid ${z.isActive ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                        {z.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'rgba(240,253,244,0.6)' }}>{z._count?.stations || 0}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button onClick={() => openEdit(z)} style={{ background: 'transparent', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="glass-card" onClick={e => e.stopPropagation()} style={{ padding: 32, width: 440, maxWidth: 'calc(100vw - 32px)', background: 'rgba(15,22,36,0.95)', border: '1px solid rgba(99,231,182,0.2)' }}>
            <h2 style={{ margin: '0 0 24px', color: '#f0fdf4', fontSize: 20 }}>{editingZone ? 'Editar Zona' : 'Nueva Zona'}</h2>
            {formError && <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, marginBottom: 20, fontSize: 13, border: '1px solid rgba(239,68,68,0.2)' }}>{formError}</div>}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', marginBottom: 8 }}>Nombre de la Zona</label>
              <input className="input-underline" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ej. UNITEC, City Mall..." />
            </div>
            {editingZone && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={formIsActive} onChange={e => setFormIsActive(e.target.checked)} style={{ accentColor: '#a3e635', width: 16, height: 16 }} />
                  <span style={{ color: '#f0fdf4', fontSize: 14 }}>Zona Activa</span>
                </label>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(240,253,244,0.2)', background: 'transparent', color: '#f0fdf4', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleSave} style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #a3e635, #22d3ee)', color: '#0d1117', cursor: 'pointer', fontWeight: 700 }}>{editingZone ? 'Guardar Cambios' : 'Crear Zona'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
