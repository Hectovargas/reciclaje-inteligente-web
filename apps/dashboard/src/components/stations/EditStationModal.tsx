import { useState, useEffect } from 'react'
import { Station, StationStatus, fetchWithAuth } from '../../config/api'

interface EditStationModalProps {
  station: Station
  onClose: () => void
  onUpdate: (updated: Station) => void
  onDelete: (id: string) => void
}

export function EditStationModal({ station, onClose, onUpdate, onDelete }: EditStationModalProps) {
  const initialZoneId = station.zoneId || (typeof station.zone === 'object' && station.zone ? station.zone.id : '')
  
  const [name, setName] = useState(station.name || '')
  const [location, setLocation] = useState(station.location || '')
  const [zoneId, setZoneId] = useState(initialZoneId || '')
  const [macAddress, setMacAddress] = useState(station.macAddress || '')
  const [capacity, setCapacity] = useState<number>(station.capacity || 100)
  const [status, setStatus] = useState<StationStatus>(station.status || 'ACTIVE')

  const [availableZones, setAvailableZones] = useState<{ id: string; name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWithAuth('/zonas')
      .then((data: { id: string; name: string }[]) => {
        setAvailableZones(data || [])
        // If station has zone object with id, make sure zoneId is populated
        if (!zoneId && station.zone && typeof station.zone === 'object' && station.zone.id) {
          setZoneId(station.zone.id)
        } else if (!zoneId && typeof station.zone === 'string') {
          const match = data.find(z => z.name === station.zone)
          if (match) setZoneId(match.id)
        }
      })
      .catch(() => {})
  }, [station, zoneId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('El nombre de la estación es requerido')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        location: location.trim() || 'Ubicación pendiente',
        capacity: Number(capacity) || 100,
        status: status.toUpperCase(),
      }

      if (zoneId) {
        payload.zoneId = zoneId
      }

      if (macAddress.trim()) {
        payload.macAddress = macAddress.trim().toUpperCase()
      }

      const res = await fetchWithAuth(`/estaciones/${station.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })

      const selectedZoneObj = availableZones.find(z => z.id === (res.zoneId || zoneId))
      const updatedStation: Station = {
        ...station,
        ...res,
        zone: selectedZoneObj ? { id: selectedZoneObj.id, name: selectedZoneObj.name } : res.zone || station.zone
      }

      onUpdate(updatedStation)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar la estación')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setDeleting(true)
    setError(null)

    try {
      await fetchWithAuth(`/estaciones/${station.id}`, {
        method: 'DELETE'
      })
      onDelete(station.id)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar la estación')
      setDeleting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card"
        onClick={e => e.stopPropagation()}
        style={{
          padding: '28px 24px',
          width: 520,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'rgba(15,22,36,0.96)',
          border: '1px solid rgba(99,231,182,0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f0fdf4' }}>Editar Estación</div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', color: 'rgba(240,253,244,0.4)', fontSize: 18, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(240,253,244,0.4)', marginBottom: 20 }}>
          Modifica los parámetros de configuración y asignación de zona de <strong style={{ color: '#22d3ee' }}>{station.id}</strong>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 18,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444', fontSize: 12, fontWeight: 600
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Nombre de la estación <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              className="input-underline"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Estación Central UNITEC"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Zona Asignada
              </label>
              <select
                value={zoneId}
                onChange={e => setZoneId(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(11,16,26,0.6)', border: 'none',
                  borderBottom: '1px solid rgba(99,231,182,0.25)',
                  outline: 'none', color: '#f0fdf4',
                  fontFamily: 'var(--font-sans)', fontSize: 13.5, padding: '8px 0',
                  cursor: 'pointer', colorScheme: 'dark',
                }}
              >
                <option value="" disabled style={{ background: '#0f1624' }}>Selecciona una zona</option>
                {availableZones.map(z => (
                  <option key={z.id} value={z.id} style={{ background: '#0f1624', color: '#f0fdf4' }}>{z.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Estado Operativo
              </label>
              <select
                value={status.toUpperCase()}
                onChange={e => setStatus(e.target.value as StationStatus)}
                style={{
                  width: '100%', background: 'rgba(11,16,26,0.6)', border: 'none',
                  borderBottom: '1px solid rgba(99,231,182,0.25)',
                  outline: 'none', color: '#f0fdf4',
                  fontFamily: 'var(--font-sans)', fontSize: 13.5, padding: '8px 0',
                  cursor: 'pointer', colorScheme: 'dark',
                }}
              >
                <option value="ACTIVE" style={{ background: '#0f1624', color: '#34d399' }}>ACTIVE (Activa)</option>
                <option value="WARNING" style={{ background: '#0f1624', color: '#fbbf24' }}>WARNING (Alerta Llenado)</option>
                <option value="PENDING_ACTIVATION" style={{ background: '#0f1624', color: '#38bdf8' }}>PENDING_ACTIVATION (Por activar)</option>
                <option value="OFFLINE" style={{ background: '#0f1624', color: '#ef4444' }}>OFFLINE (Desconectada)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Dirección MAC ESP32
              </label>
              <input
                className="input-underline"
                value={macAddress}
                onChange={e => setMacAddress(e.target.value)}
                placeholder="Ej. 24:6F:28:A1:B2:C3"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Capacidad (Litros / Items)
              </label>
              <input
                type="number"
                min="1"
                className="input-underline"
                value={capacity}
                onChange={e => setCapacity(Number(e.target.value))}
                placeholder="100"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Ubicación / Referencia física
            </label>
            <input
              className="input-underline"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Detalle o referencia del lugar"
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(99,231,182,0.1)' }}>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              style={{
                padding: '9px 16px', borderRadius: 8,
                border: confirmDelete ? '1px solid rgba(239,68,68,0.7)' : '1px solid rgba(239,68,68,0.3)',
                background: confirmDelete ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.08)',
                color: '#ef4444', fontSize: 12.5, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'all 0.2s'
              }}
            >
              {deleting ? 'Eliminando...' : confirmDelete ? '¿Confirmar eliminación?' : 'Eliminar Estación'}
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 18px', borderRadius: 8,
                  border: '1px solid rgba(99,231,182,0.15)',
                  background: 'transparent', color: 'rgba(240,253,244,0.6)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, #a3e635, #22d3ee)',
                  color: '#0d1117', cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 700,
                  boxShadow: '0 0 16px rgba(163,230,53,0.3)',
                }}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
