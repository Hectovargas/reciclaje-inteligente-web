'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ConfRing } from '@/components/common/ConfRing'
import { MAT, useApi } from '@/config/api'
import { MatIcon } from '@/components/common/MatIcon'

export type AIIdentificationEvent = {
  id: string; timestamp: string; stationId: string; stationName: string; zone: string
  material: 'paper' | 'plastic' | 'metal'; materialName: string; confidence: number
  isCorrect: boolean; imagePlaceholderText: string; detectedObjects: Array<{ label: string; confidence: number }>
}

export function AIDetailsPage() {
  const router = useRouter()
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [minConfidence, setMinConfidence] = useState<number>(0)

  const { data: metrics, loading } = useApi<any>('/dashboard/metrics', { pollIntervalMs: 10000 })
  const { data: eventsRes, loading: eventsLoading } = useApi<any>('/clasificacion?page=1&limit=50', { pollIntervalMs: 8000 })

  const eventsList = useMemo(() => {
    const rawList: any[] = eventsRes?.data || []
    return rawList.map((evt: any) => {
      const material: 'paper' | 'plastic' | 'metal' = evt.categoria === 'Papel' ? 'paper' : evt.categoria === 'Plástico' ? 'plastic' : 'metal'
      const imagePlaceholderText = evt.categoria === 'Papel' ? 'Papel / Cartón' : evt.categoria === 'Plástico' ? 'Botella / Envase' : 'Metal / Lata'
      const confidence = Math.round((evt.confianza ?? 0) * 100)
      return {
        id: evt.id, timestamp: new Date(evt.timestamp).toLocaleString('es-ES'),
        stationId: evt.stationId, stationName: evt.station?.name || 'Estación Desconocida',
        zone: evt.station?.zone?.name || 'Sin Zona', material, materialName: evt.categoria,
        confidence, isCorrect: confidence >= 80, imagePlaceholderText,
        detectedObjects: [{ label: evt.categoria, confidence }]
      }
    })
  }, [eventsRes])

  const filteredEvents = useMemo(() =>
    eventsList.filter((evt: any) => {
      const matchMat = selectedMaterial === 'all' || evt.material === selectedMaterial
      const matchSearch = evt.stationName.toLowerCase().includes(searchQuery.toLowerCase()) || evt.stationId.toLowerCase().includes(searchQuery.toLowerCase()) || evt.materialName.toLowerCase().includes(searchQuery.toLowerCase())
      return matchMat && matchSearch && evt.confidence >= minConfidence
    }), [eventsList, selectedMaterial, searchQuery, minConfidence])

  if (loading || eventsLoading || !metrics) return <div style={{ color: 'white', padding: 20 }}>Cargando datos IA...</div>

  const KPI_DATA = metrics || {}
  const IA_ACCURACY_BREAKDOWN = metrics.iaAccuracyBreakdown || []

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: '100%' }}>
      <div>
        <button onClick={() => router.push('/admin')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 99, marginBottom: 18, background: 'rgba(240,253,244,0.04)', border: '1px solid rgba(99,231,182,0.14)', color: 'rgba(240,253,244,0.55)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver al dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#a3e635', boxShadow: '0 0 14px #a3e635' }} />
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: '#f0fdf4' }}>Feed en Vivo & Diagnóstico de IA</h1>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(240,253,244,0.38)' }}>Detalle en tiempo real de escaneos de material, índice de certeza del algoritmo e inferencias detectadas.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ padding: '10px 18px', borderRadius: 12, background: 'rgba(163,230,53,0.08)', border: '1px solid rgba(163,230,53,0.22)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#a3e635', fontFamily: 'var(--font-mono)' }}>{KPI_DATA.aiConf ?? 0}%</span>
              <span style={{ fontSize: 9.5, color: 'rgba(240,253,244,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conf. Promedio</span>
            </div>
            {IA_ACCURACY_BREAKDOWN.map((item: any) => (
              <div key={item.label} style={{ padding: '10px 14px', borderRadius: 12, background: `${item.color}0a`, border: `1px solid ${item.color}25`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: item.color, fontFamily: 'var(--font-mono)' }}>{item.val}%</span>
                <span style={{ fontSize: 9, color: 'rgba(240,253,244,0.45)', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', background: 'rgba(11,16,26,0.5)', padding: 3, borderRadius: 10, border: '1px solid rgba(99,231,182,0.1)' }}>
            {[{ id: 'all', label: 'Todos' }, { id: 'paper', label: 'Papel' }, { id: 'plastic', label: 'Plástico' }, { id: 'metal', label: 'Metal' }].map(tab => (
              <button key={tab.id} onClick={() => setSelectedMaterial(tab.id)} style={{ border: 'none', background: selectedMaterial === tab.id ? 'rgba(99,231,182,0.14)' : 'transparent', color: selectedMaterial === tab.id ? '#a3e635' : 'rgba(240,253,244,0.5)', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: selectedMaterial === tab.id ? 700 : 500, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s' }}>{tab.label}</button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <input type="text" placeholder="Buscar estación, material..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 10, border: '1px solid rgba(99,231,182,0.15)', background: 'rgba(11,16,26,0.4)', color: '#f0fdf4', fontSize: 12, fontFamily: 'var(--font-sans)', outline: 'none' }} />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(240,253,244,0.4)" strokeWidth="2.5" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'rgba(240,253,244,0.4)', fontWeight: 600 }}>Confianza mín: <strong style={{ color: '#a3e635', fontFamily: 'var(--font-mono)' }}>{minConfidence}%</strong></span>
          <input type="range" min="0" max="95" step="5" value={minConfidence} onChange={e => setMinConfidence(Number(e.target.value))} style={{ accentColor: '#a3e635', cursor: 'pointer', width: 100 }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredEvents.length === 0 ? (
          <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: 'rgba(240,253,244,0.4)' }}>No se encontraron eventos de IA que coincidan con los filtros aplicados.</div>
        ) : filteredEvents.map((evt: AIIdentificationEvent) => {
          const matColor = MAT[evt.material] || '#a3e635'
          const confColor = evt.confidence >= 90 ? '#34d399' : evt.confidence >= 80 ? '#fbbf24' : '#ef4444'
          return (
            <div key={evt.id} className="glass-card" style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'center', borderLeft: `4px solid ${matColor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `${matColor}18`, border: `1px solid ${matColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MatIcon m={evt.material} color={matColor} size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#f0fdf4' }}>{evt.materialName}</span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${matColor}15`, color: matColor, border: `1px solid ${matColor}30`, textTransform: 'uppercase' }}>{evt.zone}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(240,253,244,0.6)', marginTop: 2 }}><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#a3e635' }}>{evt.stationId}</span> · {evt.stationName}</div>
                  <div style={{ fontSize: 10, color: 'rgba(240,253,244,0.35)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{evt.timestamp}</div>
                </div>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(11,16,26,0.35)', border: '1px solid rgba(99,231,182,0.08)' }}>
                <div style={{ fontSize: 9.5, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Objeto Identificado</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#f0fdf4', marginBottom: 6 }}>{evt.imagePlaceholderText}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {evt.detectedObjects.map((obj, i) => (
                    <span key={i} style={{ fontSize: 10, color: 'rgba(240,253,244,0.7)', padding: '3px 8px', borderRadius: 6, background: 'rgba(240,253,244,0.06)', border: '1px solid rgba(240,253,244,0.1)', fontFamily: 'var(--font-mono)' }}>{obj.label} ({obj.confidence}%)</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9.5, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Certeza de IA</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: confColor, fontFamily: 'var(--font-mono)' }}>{evt.confidence}%</div>
                </div>
                <div style={{ width: '100%', maxWidth: 180, height: 5, borderRadius: 3, background: 'rgba(240,253,244,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${evt.confidence}%`, borderRadius: 3, background: confColor }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
