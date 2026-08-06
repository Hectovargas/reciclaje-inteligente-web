import { useState } from 'react'
import { PENDING_STATIONS } from '../../mocks/data'

export function PendingCard({ station }: { station: typeof PENDING_STATIONS[0] }) {
  const [approved, setApproved] = useState(false)

  return (
    <div className="glass-card" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
      {!station.ready && !approved && <div className="scan-line" />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        {!station.ready && !approved ? (
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(52,211,153,0.15)',
            border: '1px solid rgba(52,211,153,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            📡
          </div>
        )}
        <div>
          {!station.ready && !approved ? (
            <>
              <div className="skeleton" style={{ width: 80, height: 10, marginBottom: 5 }} />
              <div className="skeleton" style={{ width: 120, height: 8 }} />
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f0fdf4' }}>{station.id}</div>
              <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.4)' }}>{station.location}</div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(240,253,244,0.35)' }}>
          {station.ready || approved ? `Vinculada ${station.initiated}` : `Esperando señal... ${station.initiated}`}
        </div>
        {(station.ready || approved) && !approved ? (
          <button
            onClick={() => setApproved(true)}
            style={{
              padding: '5px 14px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, #a3e635, #22d3ee)',
              color: '#0d1117', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              boxShadow: '0 0 16px rgba(163,230,53,0.3)',
            }}
          >
            Aprobar
          </button>
        ) : approved ? (
          <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>✓ Aprobada</span>
        ) : null}
      </div>
    </div>
  )
}
