import { useCountUp } from '../../hooks/useCountUp'
import { ConfRing } from '../common/ConfRing'
import {
  KPI_DATA,
  MATERIAL_CLASSIFIED_BREAKDOWN,
  IA_ACCURACY_BREAKDOWN,
} from '../../mocks/data'

export function DashboardMetrics() {
  const kgTotal = useCountUp(KPI_DATA.kgTotal)
  const kgSaved = useCountUp(KPI_DATA.kgSaved)
  const co2 = useCountUp(KPI_DATA.co2)
  const trees = useCountUp(KPI_DATA.trees)
  const accuracy = useCountUp(KPI_DATA.accuracy)

  return (
    <div style={{ flex: '1 1 320px', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
      {/* KPI · Material reciclado */}
      <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(240,253,244,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Material Clasificado
            </span>
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em', color: '#a3e635', textShadow: '0 0 24px rgba(163,230,53,0.45)', marginTop: 6 }}>
            {kgTotal.toLocaleString('es-ES')}
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(163,230,53,0.6)', marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>artículos</span>
          </div>
        </div>

        {/* Material breakdown rows */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {MATERIAL_CLASSIFIED_BREAKDOWN.map(m => (
            <div key={m.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 2 }}>
                <span style={{ color: 'rgba(240,253,244,0.6)', fontWeight: 600 }}>{m.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: m.color, fontWeight: 700 }}>
                  {m.count.toLocaleString('es-ES')} ({m.pct}%)
                </span>
              </div>
              <div style={{ height: 3, borderRadius: 1.5, background: 'rgba(240,253,244,0.06)' }}>
                <div style={{ height: '100%', borderRadius: 1.5, width: `${m.pct}%`, background: m.color, boxShadow: `0 0 6px ${m.color}60` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI · Contaminación cruzada */}
      <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'flex-start' }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(240,253,244,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Contaminación cruzada evitada
        </span>
        <div>
          <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em', color: '#22d3ee', textShadow: '0 0 32px rgba(34,211,238,0.4)' }}>
            {kgSaved.toLocaleString('es-ES')}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.5)', marginTop: 2, display: 'block' }}>artículos</span>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(240,253,244,0.5)' }}>clasificados correctamente</p>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(99,231,182,0.07)', display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <span style={{ fontSize: 11, color: 'rgba(240,253,244,0.5)' }}>~{co2.toLocaleString('es-ES')} clasificaciones IA</span>
            <span style={{ fontSize: 11, color: 'rgba(240,253,244,0.5)' }}>~{trees} estaciones</span>
          </div>
        </div>
      </div>

      {/* KPI · Rendimiento IA */}
      <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(240,253,244,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Rendimiento de Modelo IA
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, alignItems: 'center', marginTop: 16 }}>
          {/* Main Ring & Big Accuracy */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ConfRing value={KPI_DATA.aiConf} />
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', color: '#a3e635', textShadow: '0 0 24px rgba(163,230,53,0.4)', lineHeight: 1 }}>
                {(accuracy / 10).toFixed(1)}%
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,253,244,0.6)', marginTop: 4 }}>
                Precisión global
              </div>
              <div style={{ fontSize: 9.5, color: 'rgba(240,253,244,0.35)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                Conf. Media: {KPI_DATA.aiConf}%
              </div>
            </div>
          </div>

          {/* Breakdown per material with progress bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingLeft: 12, borderLeft: '1px solid rgba(99,231,182,0.08)' }}>
            {IA_ACCURACY_BREAKDOWN.map(m => (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                  <span style={{ color: 'rgba(240,253,244,0.6)', fontWeight: 600 }}>{m.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: m.color, fontWeight: 700 }}>{m.val}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(240,253,244,0.06)' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${m.val}%`, background: m.color, boxShadow: `0 0 6px ${m.color}50` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI · Tiempo entre vaciados */}
      <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(240,253,244,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Tiempo entre vaciados
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, alignItems: 'center', marginTop: 16 }}>
          {/* Main Stat */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em', color: '#34d399', textShadow: '0 0 32px rgba(52,211,153,0.45)' }}>
                {KPI_DATA.timeBetweenEmptying}
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(52,211,153,0.7)', letterSpacing: '-0.02em' }}>h</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(52,211,153,0.6)', marginTop: 4 }}>
              Promedio Red
            </div>
            <div style={{ fontSize: 10, color: 'rgba(240,253,244,0.35)', marginTop: 2 }}>
              vs. {KPI_DATA.timeBetweenEmptyingPrev}h mes anterior
            </div>
          </div>

          {/* Sub-metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingLeft: 12, borderLeft: '1px solid rgba(99,231,182,0.08)' }}>
            <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(11,16,26,0.4)', border: '1px solid rgba(99,231,182,0.08)' }}>
              <div style={{ fontSize: 8.5, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Frecuencia</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#f0fdf4', marginTop: 2 }}>{KPI_DATA.frequency}</div>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(11,16,26,0.4)', border: '1px solid rgba(99,231,182,0.08)' }}>
              <div style={{ fontSize: 8.5, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Mín. Zona</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#22d3ee', marginTop: 2 }}>{KPI_DATA.minZoneTime}</div>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(11,16,26,0.4)', border: '1px solid rgba(99,231,182,0.08)' }}>
              <div style={{ fontSize: 8.5, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Máx. Zona</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#a78bfa', marginTop: 2 }}>{KPI_DATA.maxZoneTime}</div>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(11,16,26,0.4)', border: '1px solid rgba(99,231,182,0.08)' }}>
              <div style={{ fontSize: 8.5, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Red Total</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#a3e635', marginTop: 2 }}>{KPI_DATA.totalEst}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
