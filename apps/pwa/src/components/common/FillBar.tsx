'use client';

import React from 'react';

export function FillBar({ value }: { value: number }) {
  const c = value > 85 ? '#ef4444' : value > 70 ? '#fbbf24' : '#34d399';
  return (
    <div style={{ height: 4, borderRadius: 2, background: 'rgba(240,253,244,0.07)', overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          borderRadius: 2,
          width: `${value}%`,
          background: c,
          boxShadow: `0 0 8px ${c}55`,
          transition: 'width 0.8s ease',
        }}
      />
    </div>
  );
}
