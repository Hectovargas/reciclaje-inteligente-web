import { useCountUp } from '../../hooks/useCountUp'
import { ConfRing } from '../common/ConfRing'

export function DashboardMetrics() {
  const kgTotal    = useCountUp(18432)
  const kgSaved    = useCountUp(17104)
  const co2        = useCountUp(5201)
  const trees      = useCountUp(234)
  const accuracy   = useCountUp(983)   // /10 → 98.3
  const aiConf     = 96

  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 14 }}>
      {/* KPI · Material reciclado */}
      <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(240,253,244,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Material reciclado
        </span>
        <div>
          <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em', color: '#a3e635', textShadow: '0 0 32px rgba(163,230,53,0.45)' }}>
            {kgTotal.toLocaleString('es-ES')}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(163,230,53,0.5)', marginTop: 2, display: 'block' }}>artículos</span>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(240,253,244,0.5)' }}>↑ 12.4% vs. período anterior</p>
        </div>
      </div>

      {/* KPI · Contaminación cruzada */}
      <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(240,253,244,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Contaminación cruzada evitada
        </span>
        <div>
          <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em', color: '#22d3ee', textShadow: '0 0 32px rgba(34,211,238,0.4)' }}>
            {kgSaved.toLocaleString('es-ES')}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.5)', marginTop: 2, display: 'block' }}>artículos</span>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(240,253,244,0.5)' }}>clasificados correctamente</p>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(99,231,182,0.07)', display: 'flex', gap: 14 }}>
            <span style={{ fontSize: 11, color: 'rgba(240,253,244,0.5)' }}>~{co2.toLocaleString('es-ES')} clasificaciones IA</span>
            <span style={{ fontSize: 11, color: 'rgba(240,253,244,0.5)' }}>~{trees} estaciones</span>
          </div>
        </div>
      </div>

      {/* KPI · Rendimiento IA */}
      <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(240,253,244,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Rendimiento IA
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ConfRing value={aiConf} />
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', color: '#a3e635', textShadow: '0 0 24px rgba(163,230,53,0.4)', lineHeight: 1 }}>
              {(accuracy / 10).toFixed(1)}%
            </div>
            <p style={{ margin: '4px 0 10px', fontSize: 10, color: 'rgba(240,253,244,0.5)' }}>precisión real</p>
            {[['Papel','#a3e635',99.1],['Plástico','#22d3ee',97.8],['Metal','#a78bfa',98.2]].map(([l,c,v]) => (
              <div key={String(l)} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: String(c), flexShrink: 0 }} />
                <span style={{ fontSize: 9.5, color: 'rgba(240,253,244,0.5)', width: 44 }}>{String(l)}</span>
                <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: String(c), fontWeight: 700 }}>{Number(v).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI · Tiempo entre vaciados */}
      <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(240,253,244,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Tiempo entre vaciados
        </span>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em', color: '#34d399', textShadow: '0 0 32px rgba(52,211,153,0.45)' }}>
              6.2
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(52,211,153,0.7)', letterSpacing: '-0.02em' }}>h</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(52,211,153,0.5)', marginTop: 2, display: 'block' }}>promedio red</span>
          <p style={{ margin: '6px 0 4px', fontSize: 11, color: 'rgba(240,253,244,0.5)' }}>↓ 8% más eficiente</p>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(240,253,244,0.5)', fontFamily: 'var(--font-mono)' }}>≈14 vaciados/semana</p>
        </div>
      </div>
    </div>
  )
}
