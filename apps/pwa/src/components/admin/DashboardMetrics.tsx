'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCountUp } from '../../hooks/useCountUp';
import { ConfRing } from '../common/ConfRing';
import { useApi } from '../../config/api';

export function DashboardMetrics() {
  const router = useRouter();
  const { data: metrics, loading } = useApi<any>('/dashboard/metrics', { pollIntervalMs: 10000 });

  const kgTotal = useCountUp(metrics?.kgTotal || 0);
  const kgSaved = useCountUp(metrics?.kgSaved || 0);
  const accuracy = useCountUp(metrics?.accuracy || 0);

  if (loading && !metrics) {
    return (
      <div style={{ flex: '1 1 320px', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card skeleton" style={{ height: 200, padding: 22 }} />
        ))}
      </div>
    );
  }

  const KPI_DATA = metrics || {
    kgTotal: 0,
    kgSaved: 0,
    accuracy: 0,
    aiConf: 0,
    timeBetweenEmptying: '0',
    timeBetweenEmptyingPrev: '0',
    frequency: '0 / sem',
    minZoneTime: '0h',
    maxZoneTime: '0h',
    totalEst: '0 est.',
    materialBreakdown: [],
    iaAccuracyBreakdown: [],
  };

  const MATERIAL_CLASSIFIED_BREAKDOWN =
    KPI_DATA.materialBreakdown && KPI_DATA.materialBreakdown.length > 0
      ? KPI_DATA.materialBreakdown
      : [
          { name: 'Papel', count: 0, pct: '0.0', color: '#a3e635' },
          { name: 'Plástico', count: 0, pct: '0.0', color: '#22d3ee' },
          { name: 'Metal', count: 0, pct: '0.0', color: '#a78bfa' },
        ];

  const IA_ACCURACY_BREAKDOWN =
    KPI_DATA.iaAccuracyBreakdown && KPI_DATA.iaAccuracyBreakdown.length > 0
      ? KPI_DATA.iaAccuracyBreakdown
      : [
          { label: 'Papel', val: 0, color: '#a3e635' },
          { label: 'Plástico', val: 0, color: '#22d3ee' },
          { label: 'Metal', val: 0, color: '#a78bfa' },
        ];

  return (
    <div style={{ flex: '1 1 320px', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
      {/* KPI · Material reciclado */}
      <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(240,253,244,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Material Clasificado (Hoy)
            </span>
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em', color: '#a3e635', textShadow: '0 0 24px rgba(163,230,53,0.45)', marginTop: 6 }}>
            {kgTotal.toLocaleString('es-ES')}
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(163,230,53,0.6)', marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>artículos</span>
          </div>
        </div>

        {/* Material breakdown rows */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {MATERIAL_CLASSIFIED_BREAKDOWN.map((m: any) => (
            <div key={m.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 2 }}>
                <span style={{ color: 'rgba(240,253,244,0.6)', fontWeight: 600 }}>{m.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: m.color, fontWeight: 700 }}>
                  {(m.count || 0).toLocaleString('es-ES')} ({m.pct}%)
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
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(240,253,244,0.5)' }}>clasificados correctamente por sensores e IA</p>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(99,231,182,0.07)', display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <span style={{ fontSize: 11, color: 'rgba(240,253,244,0.5)' }}>~{(kgSaved * 0.08).toFixed(1)} kg CO₂ evitado</span>
            <span style={{ fontSize: 11, color: 'rgba(240,253,244,0.5)' }}>{KPI_DATA.totalEst ?? '0 est.'}</span>
          </div>
        </div>
      </div>

      {/* KPI · Rendimiento IA */}
      <div
        className="glass-card"
        onClick={() => router.push('/admin/ia-details')}
        style={{
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          cursor: 'pointer',
          transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(163,230,53,0.4)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(163,230,53,0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(240,253,244,0.38)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Rendimiento de Modelo IA
          </span>
          <span style={{ fontSize: 10, color: '#a3e635', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            Ver detalle
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, alignItems: 'center', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ConfRing value={KPI_DATA.aiConf ?? 0} />
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', color: '#a3e635', textShadow: '0 0 24px rgba(163,230,53,0.4)', lineHeight: 1 }}>
                {accuracy > 100 ? (accuracy / 10).toFixed(1) : accuracy}%
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,253,244,0.6)', marginTop: 4 }}>
                Precisión global
              </div>
              <div style={{ fontSize: 9.5, color: 'rgba(240,253,244,0.35)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                Conf. Media: {KPI_DATA.aiConf ?? 0}%
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingLeft: 12, borderLeft: '1px solid rgba(99,231,182,0.08)' }}>
            {IA_ACCURACY_BREAKDOWN.map((m: any) => (
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
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em', color: '#34d399', textShadow: '0 0 32px rgba(52,211,153,0.45)' }}>
                {KPI_DATA.timeBetweenEmptying ?? '0'}
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(52,211,153,0.7)', letterSpacing: '-0.02em' }}>h</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(52,211,153,0.6)', marginTop: 4 }}>
              Promedio Red
            </div>
            <div style={{ fontSize: 10, color: 'rgba(240,253,244,0.35)', marginTop: 2 }}>
              vs. {KPI_DATA.timeBetweenEmptyingPrev ?? '0'}h mes anterior
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingLeft: 12, borderLeft: '1px solid rgba(99,231,182,0.08)' }}>
            <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(11,16,26,0.4)', border: '1px solid rgba(99,231,182,0.08)' }}>
              <div style={{ fontSize: 8.5, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Frecuencia</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#f0fdf4', marginTop: 2 }}>{KPI_DATA.frequency ?? '0 / sem'}</div>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(11,16,26,0.4)', border: '1px solid rgba(99,231,182,0.08)' }}>
              <div style={{ fontSize: 8.5, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Mín. Zona</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#22d3ee', marginTop: 2 }}>{KPI_DATA.minZoneTime ?? '0h'}</div>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(11,16,26,0.4)', border: '1px solid rgba(99,231,182,0.08)' }}>
              <div style={{ fontSize: 8.5, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Máx. Zona</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#a78bfa', marginTop: 2 }}>{KPI_DATA.maxZoneTime ?? '0h'}</div>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(11,16,26,0.4)', border: '1px solid rgba(99,231,182,0.08)' }}>
              <div style={{ fontSize: 8.5, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Red Total</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#a3e635', marginTop: 2 }}>{KPI_DATA.totalEst ?? '0 est.'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
