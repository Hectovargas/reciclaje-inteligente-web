'use client';

import React, { useState, useEffect, useRef } from 'react';

const today = new Date();
const fmt = (d: Date) => d.toISOString().slice(0, 10);

export function DatePicker() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(fmt(new Date(today.getTime() - 30 * 86400000)));
  const [end, setEnd] = useState(fmt(today));

  const QUICK = [
    { label: 'Hoy', days: 0 },
    { label: '7 días', days: 7 },
    { label: '30 días', days: 30 },
    { label: '3 meses', days: 90 },
    {
      label: 'Este año',
      days: Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000),
    },
  ];

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const label = start === end ? start : `${start} → ${end}`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 10,
          cursor: 'pointer',
          background: open ? 'rgba(34,211,238,0.1)' : 'rgba(22,32,50,0.8)',
          border: `1px solid ${open ? 'rgba(34,211,238,0.4)' : 'rgba(99,231,182,0.15)'}`,
          color: '#f0fdf4',
          fontFamily: 'var(--font-sans)',
          boxShadow: open ? '0 0 16px rgba(34,211,238,0.12)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(34,211,238,0.85)"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#f0fdf4' }}>{label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(240,253,244,0.35)"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 200,
            width: 288,
            background: 'rgba(11,16,26,0.98)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(99,231,182,0.16)',
            borderRadius: 14,
            padding: 20,
            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          }}
        >
          <p
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: 'rgba(240,253,244,0.35)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: '0 0 10px',
            }}
          >
            Rangos rápidos
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
            {QUICK.map((q) => (
              <button
                key={q.label}
                onClick={() => {
                  const s = q.days === 0 ? today : new Date(today.getTime() - q.days * 86400000);
                  setStart(fmt(s));
                  setEnd(fmt(today));
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 99,
                  border: 'none',
                  cursor: 'pointer',
                  background: 'rgba(34,211,238,0.08)',
                  boxShadow: 'inset 0 0 0 1px rgba(34,211,238,0.2)',
                  color: '#22d3ee',
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  transition: 'background 0.15s',
                }}
              >
                {q.label}
              </button>
            ))}
          </div>
          <div style={{ height: 1, background: 'rgba(99,231,182,0.07)', margin: '0 0 16px' }} />
          <p
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: 'rgba(240,253,244,0.35)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: '0 0 10px',
            }}
          >
            Personalizado
          </p>
          {[
            { label: 'Inicio', value: start, set: setStart, min: undefined, max: end },
            { label: 'Fin', value: end, set: setEnd, min: start, max: fmt(today) },
          ].map((f) => (
            <div key={f.label} style={{ marginBottom: 10 }}>
              <p
                style={{
                  fontSize: 9.5,
                  color: 'rgba(240,253,244,0.35)',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  margin: '0 0 5px',
                }}
              >
                {f.label}
              </p>
              <input
                type="date"
                value={f.value}
                min={f.min}
                max={f.max}
                onChange={(e) => f.set(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  outline: 'none',
                  cursor: 'pointer',
                  background: 'rgba(22,32,50,0.7)',
                  border: '1px solid rgba(99,231,182,0.14)',
                  color: '#f0fdf4',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  colorScheme: 'dark',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
          <button
            onClick={() => setOpen(false)}
            style={{
              marginTop: 6,
              width: '100%',
              padding: '9px 0',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg,#a3e635,#22d3ee)',
              color: '#0d1117',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(163,230,53,0.25)',
            }}
          >
            Aplicar rango
          </button>
        </div>
      )}
    </div>
  );
}
