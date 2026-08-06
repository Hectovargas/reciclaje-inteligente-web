import { useState } from 'react'
import { Station, ZONAS } from '../../mocks/data'

export function AddStationModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: Station) => void }) {
  const [name, setName] = useState('')
  const [zona, setZona] = useState('')
  const [location, setLocation] = useState('')
  const [generated, setGenerated] = useState('')
  const [copied, setCopied] = useState(false)

  const generate = () => {
    if (!name || !zona) return
    const token = 'tk_' + Math.random().toString(36).slice(2, 14)
    setGenerated(token)
    const newStation: Station = {
      id: 'ES-' + String(Math.floor(Math.random() * 900) + 100),
      name, location: location || 'Ubicación pendiente',
      status: 'offline', capacity: 0, today: 0, token,
      hardware: { cpu: 0, temp: 0, uptime: '—' },
    }
    onAdd(newStation)
  }

  const copy = () => {
    navigator.clipboard.writeText(generated).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card"
        onClick={e => e.stopPropagation()}
        style={{
          padding: 32, width: 440,
          background: 'rgba(15,22,36,0.95)',
          border: '1px solid rgba(99,231,182,0.2)',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, color: '#f0fdf4', marginBottom: 6 }}>Nueva estación</div>
        <div style={{ fontSize: 12, color: 'rgba(240,253,244,0.4)', marginBottom: 28 }}>Registra una nueva estación en la red</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Nombre de la estación
            </label>
            <input
              className="input-underline"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Plaza de la Tecnología"
            />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Zona <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={zona}
              onChange={e => setZona(e.target.value)}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                borderBottom: `1px solid ${zona ? 'rgba(99,231,182,0.25)' : 'rgba(99,231,182,0.25)'}`,
                outline: 'none', color: zona ? '#f0fdf4' : 'rgba(240,253,244,0.3)',
                fontFamily: 'var(--font-sans)', fontSize: 14, padding: '8px 0',
                cursor: 'pointer', colorScheme: 'dark', appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(240,253,244,0.35)' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center',
              }}
              onFocus={e => { e.target.style.borderBottomColor = 'rgba(34,211,238,0.45)' }}
              onBlur={e => { e.target.style.borderBottomColor = 'rgba(99,231,182,0.25)' }}
            >
              <option value="" disabled style={{ background: '#0f1624' }}>Selecciona una zona</option>
              {ZONAS.map(z => (
                <option key={z} value={z} style={{ background: '#0f1624', color: '#f0fdf4' }}>{z}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Ubicación
            </label>
            <input
              className="input-underline"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Dirección o referencia"
            />
          </div>
        </div>

        {generated ? (
          <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: 'rgba(163,230,53,0.06)', border: '1px solid rgba(163,230,53,0.2)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#a3e635', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Token generado
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#22d3ee', wordBreak: 'break-all' }}>
                {generated}
              </div>
              <button
                onClick={copy}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: 'none', flexShrink: 0,
                  background: copied ? 'rgba(52,211,153,0.2)' : 'rgba(34,211,238,0.1)',
                  color: copied ? '#34d399' : '#22d3ee',
                  cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                }}
              >
                <span className={copied ? 'check-pop' : ''} style={{ display: 'inline-block' }}>
                  {copied ? '✓' : '⧉'}
                </span>
              </button>
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px 0', borderRadius: 10,
            border: '1px solid rgba(99,231,182,0.15)',
            background: 'transparent', color: 'rgba(240,253,244,0.5)',
            cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
          }}>
            Cancelar
          </button>
          <button onClick={generate} disabled={!name || !zona} style={{
            flex: 2, padding: '11px 0', borderRadius: 10, border: 'none',
            background: (name && zona) ? 'linear-gradient(135deg, #a3e635, #22d3ee)' : 'rgba(99,231,182,0.1)',
            color: (name && zona) ? '#0d1117' : 'rgba(240,253,244,0.3)',
            cursor: (name && zona) ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700,
            boxShadow: (name && zona) ? '0 0 24px rgba(163,230,53,0.3)' : 'none',
            transition: 'all 0.3s',
          }}>
            {generated ? 'Regenerar token' : 'Generar token de conexión'}
          </button>
        </div>
      </div>
    </div>
  )
}
