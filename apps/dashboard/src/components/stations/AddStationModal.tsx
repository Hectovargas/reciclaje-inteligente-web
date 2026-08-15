import { useState, useEffect } from 'react'
import { Station, fetchWithAuth } from '../../config/api'

interface AddStationModalProps {
  onClose: () => void
  onAdd: (s: Station) => void
}

export function AddStationModal({ onClose, onAdd }: AddStationModalProps) {
  const [name, setName] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [location, setLocation] = useState('')
  const [macAddress, setMacAddress] = useState('')
  const [capacity, setCapacity] = useState<number>(100)

  const [generatedToken, setGeneratedToken] = useState('')
  const [generatedProvToken, setGeneratedProvToken] = useState('')
  const [createdStationId, setCreatedStationId] = useState('')
  const [copiedToken, setCopiedToken] = useState(false)
  const [copiedProv, setCopiedProv] = useState(false)
  const [availableZones, setAvailableZones] = useState<{ id: string; name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWithAuth('/zonas')
      .then((data: { id: string; name: string }[]) => {
        setAvailableZones(data || [])
        if (data && data.length > 0) {
          setZoneId(data[0].id)
        }
      })
      .catch(() => {})
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !zoneId) {
      setError('Nombre y Zona son campos requeridos.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        location: location.trim() || 'Ubicación pendiente',
        zoneId,
        capacity: Number(capacity) || 100,
      }

      if (macAddress.trim()) {
        payload.macAddress = macAddress.trim().toUpperCase()
      }

      const res = await fetchWithAuth('/estaciones', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      const selectedZoneObj = availableZones.find(z => z.id === zoneId)
      const newStation: Station = {
        ...res,
        zone: selectedZoneObj ? { id: selectedZoneObj.id, name: selectedZoneObj.name } : res.zone || zoneId
      }

      setGeneratedToken(res.token)
      setGeneratedProvToken(res.provisioningToken || '')
      setCreatedStationId(res.id)
      onAdd(newStation)
    } catch (err: any) {
      setError(err?.message || 'Error al registrar la estación')
    } finally {
      setSaving(false)
    }
  }

  const copyToken = () => {
    navigator.clipboard.writeText(generatedToken).catch(() => {})
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  const copyProvToken = () => {
    navigator.clipboard.writeText(generatedProvToken).catch(() => {})
    setCopiedProv(true)
    setTimeout(() => setCopiedProv(false), 2000)
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
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f0fdf4' }}>Nueva Estación IoT</div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', color: 'rgba(240,253,244,0.4)', fontSize: 18, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(240,253,244,0.4)', marginBottom: 20 }}>
          Registra una nueva estación de reciclaje conectada mediante ESP32 y sensores ultrasónicos.
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

        {!generatedToken ? (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
                  Zona <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={zoneId}
                  onChange={e => setZoneId(e.target.value)}
                  style={{
                    width: '100%', background: 'rgba(11,16,26,0.6)', border: 'none',
                    borderBottom: '1px solid rgba(99,231,182,0.25)',
                    outline: 'none', color: zoneId ? '#f0fdf4' : 'rgba(240,253,244,0.3)',
                    fontFamily: 'var(--font-sans)', fontSize: 13.5, padding: '8px 0',
                    cursor: 'pointer', colorScheme: 'dark',
                  }}
                  required
                >
                  <option value="" disabled style={{ background: '#0f1624' }}>Selecciona una zona</option>
                  {availableZones.map(z => (
                    <option key={z.id} value={z.id} style={{ background: '#0f1624', color: '#f0fdf4' }}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Capacidad Total (Items / Litros)
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
                Dirección MAC ESP32 (Opcional para Zero-Touch)
              </label>
              <input
                className="input-underline"
                value={macAddress}
                onChange={e => setMacAddress(e.target.value)}
                placeholder="Ej. 24:6F:28:A1:B2:C3"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
              <span style={{ fontSize: 10, color: 'rgba(240,253,244,0.35)', marginTop: 4, display: 'block' }}>
                Si se especifica MAC, la estación iniciará en estado <code>PENDING_ACTIVATION</code> hasta su primer handshake.
              </span>
            </div>

            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Detalles de Ubicación Física
              </label>
              <input
                className="input-underline"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Ej. Pasillo principal, junto a cafetería"
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10,
                  border: '1px solid rgba(99,231,182,0.15)',
                  background: 'transparent', color: 'rgba(240,253,244,0.5)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!name.trim() || !zoneId || saving}
                style={{
                  flex: 2, padding: '11px 0', borderRadius: 10, border: 'none',
                  background: (name.trim() && zoneId && !saving) ? 'linear-gradient(135deg, #a3e635, #22d3ee)' : 'rgba(99,231,182,0.1)',
                  color: (name.trim() && zoneId && !saving) ? '#0d1117' : 'rgba(240,253,244,0.3)',
                  cursor: (name.trim() && zoneId && !saving) ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700,
                  boxShadow: (name.trim() && zoneId && !saving) ? '0 0 24px rgba(163,230,53,0.3)' : 'none',
                  transition: 'all 0.3s',
                }}
              >
                {saving ? 'Registrando en Backend...' : 'Crear Estación y Generar Tokens'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399', marginBottom: 2 }}>
                ✓ Estación registrada exitosamente
              </div>
              <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.6)' }}>
                ID: <code style={{ color: '#22d3ee' }}>{createdStationId}</code>
              </div>
            </div>

            {/* Access Token */}
            <div style={{ padding: 16, borderRadius: 10, background: 'rgba(163,230,53,0.06)', border: '1px solid rgba(163,230,53,0.2)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#a3e635', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Token de Acceso IoT (API Access Token)
              </div>
              <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.45)', marginBottom: 8 }}>
                Utilizado para autenticar solicitudes de clasificación y telemetría desde la estación.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#22d3ee', wordBreak: 'break-all', background: 'rgba(11,16,26,0.5)', padding: '8px 10px', borderRadius: 6 }}>
                  {generatedToken}
                </div>
                <button
                  type="button"
                  onClick={copyToken}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none', flexShrink: 0,
                    background: copiedToken ? 'rgba(52,211,153,0.2)' : 'rgba(34,211,238,0.1)',
                    color: copiedToken ? '#34d399' : '#22d3ee',
                    cursor: 'pointer', fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}
                  title="Copiar token"
                >
                  <span className={copiedToken ? 'check-pop' : ''} style={{ display: 'inline-block' }}>
                    {copiedToken ? '✓' : '⧉'}
                  </span>
                </button>
              </div>
            </div>

            {/* Provisioning Token */}
            {generatedProvToken && (
              <div style={{ padding: 16, borderRadius: 10, background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#22d3ee', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Token de Aprovisionamiento (Zero-Touch Provisioning)
                </div>
                <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.45)', marginBottom: 8 }}>
                  Cargue este token en el firmware del ESP32 para el handshake de activación automática.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#a3e635', wordBreak: 'break-all', background: 'rgba(11,16,26,0.5)', padding: '8px 10px', borderRadius: 6 }}>
                    {generatedProvToken}
                  </div>
                  <button
                    type="button"
                    onClick={copyProvToken}
                    style={{
                      width: 36, height: 36, borderRadius: 8, border: 'none', flexShrink: 0,
                      background: copiedProv ? 'rgba(52,211,153,0.2)' : 'rgba(163,230,53,0.1)',
                      color: copiedProv ? '#34d399' : '#a3e635',
                      cursor: 'pointer', fontSize: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.3s',
                    }}
                    title="Copiar token de aprovisionamiento"
                  >
                    <span className={copiedProv ? 'check-pop' : ''} style={{ display: 'inline-block' }}>
                      {copiedProv ? '✓' : '⧉'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #a3e635, #22d3ee)',
                color: '#0d1117', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700,
                marginTop: 8
              }}
            >
              Completar y Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
