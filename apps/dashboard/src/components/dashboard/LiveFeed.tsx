import { useState, useEffect, useRef } from 'react'
import { FEED_INIT, POOL, MAT } from '../../mocks/data'
import { MatIcon } from '../common/MatIcon'

export function LiveFeed() {
  const [feed, setFeed] = useState(FEED_INIT)
  const [flashId, setFlashId] = useState<number | null>(null)
  const nextId = useRef(100)

  useEffect(() => {
    const id = setInterval(() => {
      const evt = POOL[Math.floor(Math.random() * POOL.length)]
      const item = { ...evt, id: nextId.current++, time: 'ahora' }
      setFeed(prev => [item, ...prev.slice(0, 9)])
      setFlashId(item.id)
      setTimeout(() => setFlashId(null), 1400)
    }, 3800)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="glass-card" style={{ width: 260, height: 420, flexShrink: 0, padding: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Feed en Vivo</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div className="pulse-dot" style={{ width: 6, height: 6 }} />
          <span style={{ fontSize: 9, color: 'rgba(240,253,244,0.28)', fontFamily: 'var(--font-mono)' }}>LIVE</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto', flex: 1 }}>
        {feed.map(item => (
          <div key={item.id}
            className={flashId === item.id ? 'row-flash' : ''}
            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 8, transition: 'background 0.25s', flexShrink: 0 }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 7, flexShrink: 0,
              background: `${MAT[item.material]}15`, border: `1px solid ${MAT[item.material]}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MatIcon m={item.material} color={MAT[item.material]} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f0fdf4' }}>{item.type}</div>
              <div style={{ fontSize: 10, color: 'rgba(240,253,244,0.32)', fontFamily: 'var(--font-mono)' }}>{item.station}</div>
            </div>
            <span style={{ fontSize: 9.5, color: MAT[item.material], fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', textShadow: `0 0 8px ${MAT[item.material]}55` }}>{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
