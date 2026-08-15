import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfRing } from '../common/ConfRing'
import { MAT, useApi } from '../../config/api'
import { MatIcon } from '../common/MatIcon'

export type AIIdentificationEvent = {
  id: string
  timestamp: string
  stationId: string
  stationName: string
  zone: string
  material: 'paper' | 'plastic' | 'metal'
  materialName: string
  confidence: number
  isCorrect: boolean
  imagePlaceholderText: string
  detectedObjects: Array<{ label: string; confidence: number }>
}

const MOCK_AI_DETAILED_FEED: AIIdentificationEvent[] = [
  {
    id: 'det-101',
    timestamp: 'Hace 8s (15:17:02)',
    stationId: 'ES-042',
    stationName: 'Plaza Principal UNITEC',
    zone: 'UNITEC',
    material: 'paper',
    materialName: 'Papel',
    confidence: 99.4,
    isCorrect: true,
    imagePlaceholderText: 'Cuaderno / Hoja Impresa',
    detectedObjects: [
      { label: 'Papel celulosa', confidence: 99.4 },
      { label: 'Tinta / Texto', confidence: 94.2 },
    ],
  },
  {
    id: 'det-102',
    timestamp: 'Hace 24s (15:16:46)',
    stationId: 'ES-018',
    stationName: 'Edificio 2 UNITEC',
    zone: 'UNITEC',
    material: 'plastic',
    materialName: 'Plástico',
    confidence: 97.8,
    isCorrect: true,
    imagePlaceholderText: 'Botella PET 500ml',
    detectedObjects: [
      { label: 'Polietileno tereftalato (PET-1)', confidence: 97.8 },
      { label: 'Tapa de plástico', confidence: 91.5 },
    ],
  },
  {
    id: 'det-103',
    timestamp: 'Hace 45s (15:16:25)',
    stationId: 'ES-055',
    stationName: 'Cafetería UNITEC',
    zone: 'UNITEC',
    material: 'metal',
    materialName: 'Metal',
    confidence: 98.9,
    isCorrect: true,
    imagePlaceholderText: 'Lata de Aluminio 355ml',
    detectedObjects: [
      { label: 'Aluminio reciclable', confidence: 98.9 },
      { label: 'Cuerpo metálico', confidence: 96.0 },
    ],
  },
  {
    id: 'det-104',
    timestamp: 'Hace 1m 12s (15:15:58)',
    stationId: 'ES-077',
    stationName: 'Nivel 1 City Mall',
    zone: 'City Mall',
    material: 'plastic',
    materialName: 'Plástico',
    confidence: 84.2,
    isCorrect: true,
    imagePlaceholderText: 'Envase HDPE Semitransparente',
    detectedObjects: [
      { label: 'HDPE Cloro/Detergente', confidence: 84.2 },
      { label: 'Residuo sintético', confidence: 78.0 },
    ],
  },
  {
    id: 'det-105',
    timestamp: 'Hace 1m 50s (15:15:20)',
    stationId: 'ES-088',
    stationName: 'Cines City Mall',
    zone: 'City Mall',
    material: 'paper',
    materialName: 'Papel',
    confidence: 96.1,
    isCorrect: true,
    imagePlaceholderText: 'Caja de Cartón para Cotufas/Palomitas',
    detectedObjects: [
      { label: 'Cartoncillo comprimido', confidence: 96.1 },
      { label: 'Fibra de celulosa', confidence: 92.4 },
    ],
  },
  {
    id: 'det-106',
    timestamp: 'Hace 2m 15s (15:14:55)',
    stationId: 'ES-033',
    stationName: 'Torre 1 Altia',
    zone: 'Altia',
    material: 'metal',
    materialName: 'Metal',
    confidence: 79.5,
    isCorrect: false,
    imagePlaceholderText: 'Lata con residuo orgánico interno',
    detectedObjects: [
      { label: 'Metal (Hoja de lata)', confidence: 79.5 },
      { label: 'Contaminante orgánico', confidence: 68.1 },
    ],
  },
  {
    id: 'det-107',
    timestamp: 'Hace 3m 05s (15:14:05)',
    stationId: 'ES-011',
    stationName: 'Entrada Altara',
    zone: 'Altara',
    material: 'paper',
    materialName: 'Papel',
    confidence: 99.7,
    isCorrect: true,
    imagePlaceholderText: 'Revista / Folleto Glossy',
    detectedObjects: [
      { label: 'Papel satinado', confidence: 99.7 },
    ],
  },
  {
    id: 'det-108',
    timestamp: 'Hace 3m 40s (15:13:30)',
    stationId: 'ES-099',
    stationName: 'Acceso Galerias',
    zone: 'Mall Galerias',
    material: 'plastic',
    materialName: 'Plástico',
    confidence: 95.3,
    isCorrect: true,
    imagePlaceholderText: 'Vaso Plástico Transparente',
    detectedObjects: [
      { label: 'PP (Polipropileno)', confidence: 95.3 },
    ],
  },
]

export function AIDetailsPage() {
  const navigate = useNavigate()
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [minConfidence, setMinConfidence] = useState<number>(0)

  const { data: metrics, loading } = useApi<any>('/dashboard/metrics', { pollIntervalMs: 10000 })
  const { data: eventsRes, loading: eventsLoading } = useApi<any>('/clasificacion?page=1&limit=50', { pollIntervalMs: 8000 })

  const eventsList = useMemo(() => {
    const rawList: any[] = eventsRes?.data || []
    return rawList.map((evt: any) => {
      const material = evt.categoria === 'Papel' ? 'paper' : evt.categoria === 'Plástico' ? 'plastic' : 'metal'
      const imagePlaceholderText = evt.categoria === 'Papel' ? 'Papel / Cartón' : evt.categoria === 'Plástico' ? 'Botella / Envase' : 'Metal / Lata'
      const confidence = Math.round((evt.confianza ?? 0) * 100)
      return {
        id: evt.id,
        timestamp: new Date(evt.timestamp).toLocaleString('es-ES'),
        stationId: evt.stationId,
        stationName: evt.station?.name || 'Estación Desconocida',
        zone: evt.station?.zone?.name || 'Sin Zona',
        material,
        materialName: evt.categoria,
        confidence,
        isCorrect: confidence >= 80,
        imagePlaceholderText,
        detectedObjects: [
          { label: evt.categoria, confidence }
        ]
      }
    })
  }, [eventsRes])

  const filteredEvents = useMemo(() => {
    return eventsList.filter((evt: any) => {
      const matchMat = selectedMaterial === 'all' || evt.material === selectedMaterial
      const matchSearch =
        evt.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.stationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.imagePlaceholderText.toLowerCase().includes(searchQuery.toLowerCase())
      const matchConf = evt.confidence >= minConfidence
      return matchMat && matchSearch && matchConf
    })
  }, [eventsList, selectedMaterial, searchQuery, minConfidence])

  if (loading || eventsLoading || !metrics) return <div style={{ color: 'white', padding: 20 }}>Cargando datos IA...</div>

  const KPI_DATA = metrics || {}
  const IA_ACCURACY_BREAKDOWN = metrics.iaAccuracyBreakdown || []

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: '100%' }}>
      {/* Back button and Header */}
      <div>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 14px', borderRadius: 99, marginBottom: 18,
            background: 'rgba(240,253,244,0.04)', border: '1px solid rgba(99,231,182,0.14)',
            color: 'rgba(240,253,244,0.55)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f0fdf4'; e.currentTarget.style.borderColor = 'rgba(99,231,182,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,253,244,0.55)'; e.currentTarget.style.borderColor = 'rgba(99,231,182,0.14)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver al dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', background: '#a3e635',
                boxShadow: '0 0 14px #a3e635'
              }} />
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: '#f0fdf4' }}>
                Feed en Vivo & Diagnóstico de IA
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(240,253,244,0.38)' }}>
              Detalle en tiempo real de escaneos de material, índice de certeza del algoritmo e inferencias detectadas.
            </p>
          </div>

          {/* AI Accuracy Pill Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              padding: '10px 18px', borderRadius: 12,
              background: 'rgba(163,230,53,0.08)', border: '1px solid rgba(163,230,53,0.22)',
              display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#a3e635', fontFamily: 'var(--font-mono)' }}>
                {KPI_DATA.aiConf}%
              </span>
              <span style={{ fontSize: 9.5, color: 'rgba(240,253,244,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Conf. Promedio
              </span>
            </div>

            {IA_ACCURACY_BREAKDOWN.map((item: any) => (
              <div key={item.label} style={{
                padding: '10px 14px', borderRadius: 12,
                background: `${item.color}0a`, border: `1px solid ${item.color}25`,
                display: 'flex', flexDirection: 'column', alignItems: 'center'
              }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: item.color, fontFamily: 'var(--font-mono)' }}>
                  {item.val}%
                </span>
                <span style={{ fontSize: 9, color: 'rgba(240,253,244,0.45)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Controls Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1, minWidth: 260 }}>
          {/* Material Filter Buttons */}
          <div style={{ display: 'flex', background: 'rgba(11,16,26,0.5)', padding: 3, borderRadius: 10, border: '1px solid rgba(99,231,182,0.1)' }}>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'paper', label: 'Papel' },
              { id: 'plastic', label: 'Plástico' },
              { id: 'metal', label: 'Metal' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedMaterial(tab.id)}
                style={{
                  border: 'none',
                  background: selectedMaterial === tab.id ? 'rgba(99,231,182,0.14)' : 'transparent',
                  color: selectedMaterial === tab.id ? '#a3e635' : 'rgba(240,253,244,0.5)',
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: selectedMaterial === tab.id ? 700 : 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <input
              type="text"
              placeholder="Buscar estación, material u objeto..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 10,
                border: '1px solid rgba(99,231,182,0.15)',
                background: 'rgba(11,16,26,0.4)',
                color: '#f0fdf4',
                fontSize: 12,
                fontFamily: 'var(--font-sans)',
                outline: 'none',
              }}
            />
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(240,253,244,0.4)"
              strokeWidth="2.5"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Confidence threshold slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'rgba(240,253,244,0.4)', fontWeight: 600 }}>
            Confianza mín: <strong style={{ color: '#a3e635', fontFamily: 'var(--font-mono)' }}>{minConfidence}%</strong>
          </span>
          <input
            type="range"
            min="0"
            max="95"
            step="5"
            value={minConfidence}
            onChange={e => setMinConfidence(Number(e.target.value))}
            style={{ accentColor: '#a3e635', cursor: 'pointer', width: 100 }}
          />
        </div>
      </div>

      {/* Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredEvents.length === 0 ? (
          <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: 'rgba(240,253,244,0.4)' }}>
            No se encontraron eventos de IA que coincidan con los filtros aplicados.
          </div>
        ) : (
          filteredEvents.map(evt => {
            const matColor = MAT[evt.material] || '#a3e635'
            const confColor = evt.confidence >= 90 ? '#34d399' : evt.confidence >= 80 ? '#fbbf24' : '#ef4444'

            return (
              <div
                key={evt.id}
                className="glass-card"
                style={{
                  padding: 18,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 16,
                  alignItems: 'center',
                  borderLeft: `4px solid ${matColor}`,
                  transition: 'transform 0.2s, background 0.2s',
                }}
              >
                {/* Left: Material Info & Station */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `${matColor}18`, border: `1px solid ${matColor}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 12px ${matColor}20`
                  }}>
                    <MatIcon m={evt.material} color={matColor} size={22} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#f0fdf4' }}>{evt.materialName}</span>
                      <span style={{
                        fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: `${matColor}15`, color: matColor, border: `1px solid ${matColor}30`,
                        textTransform: 'uppercase'
                      }}>
                        {evt.zone}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: 'rgba(240,253,244,0.6)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#a3e635' }}>{evt.stationId}</span>
                      <span>·</span>
                      <span>{evt.stationName}</span>
                    </div>

                    <div style={{ fontSize: 10, color: 'rgba(240,253,244,0.35)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                      {evt.timestamp}
                    </div>
                  </div>
                </div>

                {/* Middle: Inferred Objects & Visual Tag */}
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(11,16,26,0.35)', border: '1px solid rgba(99,231,182,0.08)' }}>
                  <div style={{ fontSize: 9.5, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                    Objeto Identificado
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#f0fdf4', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(163,230,53,0.8)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    {evt.imagePlaceholderText}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {evt.detectedObjects.map((obj, i) => (
                      <span key={i} style={{
                        fontSize: 10, color: 'rgba(240,253,244,0.7)', padding: '3px 8px', borderRadius: 6,
                        background: 'rgba(240,253,244,0.06)', border: '1px solid rgba(240,253,244,0.1)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {obj.label} ({obj.confidence}%)
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right: Confidence Score Badge & Progress Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9.5, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Certeza de IA
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: confColor, fontFamily: 'var(--font-mono)', textShadow: `0 0 12px ${confColor}40` }}>
                        {evt.confidence}%
                      </div>
                    </div>

                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: evt.isCorrect ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
                      border: `1px solid ${evt.isCorrect ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: evt.isCorrect ? '#34d399' : '#ef4444',
                    }} title={evt.isCorrect ? 'Clasificación Correcta' : 'Alerta de Contaminación Cruzada'}>
                      {evt.isCorrect ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      )}
                    </div>
                  </div>

                  <div style={{ width: '100%', maxWidth: 180, height: 5, borderRadius: 3, background: 'rgba(240,253,244,0.06)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${evt.confidence}%`, borderRadius: 3,
                      background: confColor, boxShadow: `0 0 8px ${confColor}60`
                    }} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
