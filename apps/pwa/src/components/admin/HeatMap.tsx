'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '../../config/api';

export function HeatMap() {
  const router = useRouter();
  const { data: metrics, loading } = useApi<any>('/dashboard/metrics', { pollIntervalMs: 10000 });
  const ZONES = metrics?.zonesData || [];

  if (loading && !metrics) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10, padding: 10 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />
        ))}
      </div>
    );
  }

  if (ZONES.length === 0) {
    return (
      <div style={{ color: 'rgba(240,253,244,0.4)', textAlign: 'center', padding: 24, fontSize: 13 }}>
        No hay datos de actividad por zona registrados aún.
      </div>
    );
  }

  const maxVal = Math.max(...ZONES.map((z: any) => z.value || 0), 1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
      {ZONES.map((z: any) => {
        const val = z.value || 0;
        const ratio = val / maxVal;
        const intensity =
          ratio >= 0.85
            ? { bg: 'rgba(163,230,53,0.18)', border: 'rgba(163,230,53,0.5)', text: '#a3e635', tag: 'Muy Alta' }
            : ratio >= 0.55
            ? { bg: 'rgba(34,211,238,0.14)', border: 'rgba(34,211,238,0.4)', text: '#22d3ee', tag: 'Alta' }
            : ratio >= 0.3
            ? { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.38)', text: '#fbbf24', tag: 'Media' }
            : { bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)', text: '#a78bfa', tag: 'Baja' };

        const stationCount = z.stations?.length || 0;

        return (
          <button
            key={z.id}
            onClick={() => router.push(`/admin/zonas/${z.id}`)}
            style={{
              padding: '14px 8px',
              borderRadius: 10,
              border: `1px solid ${intensity.border}`,
              background: intensity.bg,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 5,
              boxShadow: `0 0 12px ${intensity.border}30`,
              transition: 'all 0.22s cubic-bezier(.4,0,.2,1)',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = `0 0 24px ${intensity.border}55`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = `0 0 12px ${intensity.border}30`;
            }}
            title={`Zona: ${z.name} - ${val}% de actividad`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: intensity.text,
                  textShadow: `0 0 14px ${intensity.text}70`,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {val}%
              </span>
              <span style={{ fontSize: 7.5, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.04em' }}>
                % actividad
              </span>
            </div>
            <span
              style={{
                fontSize: 9.5,
                color: 'rgba(240,253,244,0.85)',
                fontWeight: 700,
                marginTop: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
            >
              {z.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 8.5, color: 'rgba(240,253,244,0.4)', fontFamily: 'var(--font-mono)' }}>
                {stationCount} est.
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
