import { useState, useEffect } from 'react'
import { MAT, fetchWithAuth } from '../../config/api'
import { MatIcon } from '../common/MatIcon'

export function LiveFeed() {
  const [feed, setFeed] = useState<any[]>([])
  const [flashId, setFlashId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let lastId: string | null = null
    
    async function loadFeed() {
      try {
        const res = await fetchWithAuth('/clasificacion?page=1&limit=20')
        if (!mounted || !res?.data) return
        
        const mapped = res.data.map((evt: any) => {
          const cat = evt.categoria || evt.material || 'Plástico'
          let matKey = 'plastic'
          if (cat.toLowerCase().includes('papel') || cat.toLowerCase().includes('carton') || cat.toLowerCase().includes('cartón')) matKey = 'paper'
          else if (cat.toLowerCase().includes('plastic') || cat.toLowerCase().includes('plástic') || cat.toLowerCase().includes('pet')) matKey = 'plastic'
          else if (cat.toLowerCase().includes('metal') || cat.toLowerCase().includes('aluminio') || cat.toLowerCase().includes('lata')) matKey = 'metal'
          else if (cat.toLowerCase().includes('vidrio')) matKey = 'glass'

          return {
            id: evt.id,
            type: cat,
            station: evt.station?.name || 'Estación IoT',
            material: matKey,
            confidence: evt.confianza ? Math.round(evt.confianza * 100) : null,
            time: new Date(evt.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        })
        
        setFeed(mapped.slice(0, 10))
        
        if (mapped.length > 0 && lastId !== mapped[0].id) {
          if (lastId !== null) {
            setFlashId(mapped[0].id)
            setTimeout(() => { if (mounted) setFlashId(null) }, 1400)
          }
          lastId = mapped[0].id
        }
      } catch (err) {
        console.error('Error fetching live feed', err)
      }
    }
    
    loadFeed()
    const interval = setInterval(loadFeed, 5000) // Poll every 5s for live classification telemetry
    
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="glass-card" style={{ flex: '1 1 260px', minWidth: 260, height: 420, padding: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Feed en Vivo</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div className="pulse-dot" style={{ width: 6, height: 6 }} />
          <span style={{ fontSize: 9, color: 'rgba(240,253,244,0.28)', fontFamily: 'var(--font-mono)' }}>LIVE</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto', flex: 1 }}>
        {feed.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'rgba(240,253,244,0.3)', fontSize: 12 }}>
            Esperando clasificaciones en tiempo real...
          </div>
        ) : (
          feed.map(item => {
            const color = MAT[item.material] || '#22d3ee'
            return (
              <div
                key={item.id}
                className={flashId === item.id ? 'row-flash' : ''}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 8, transition: 'background 0.25s', flexShrink: 0 }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                  background: `${color}15`, border: `1px solid ${color}28`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MatIcon m={item.material} color={color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f0fdf4', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{item.type}</span>
                    {item.confidence && (
                      <span style={{ fontSize: 9.5, color: '#a3e635', fontFamily: 'var(--font-mono)' }}>
                        {item.confidence}%
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(240,253,244,0.32)', fontFamily: 'var(--font-mono)' }}>{item.station}</div>
                </div>
                <span style={{ fontSize: 9.5, color: color, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', textShadow: `0 0 8px ${color}55` }}>{item.time}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
