'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!window.navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #b45309, #d97706)',
        color: '#fff',
        padding: '0.5rem 1rem',
        fontSize: '0.8rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <WifiOff size={16} />
        <span>Modo sin conexión. Usando caché offline de la PWA.</span>
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: '#fff',
          borderRadius: '6px',
          padding: '0.2rem 0.5rem',
          fontSize: '0.75rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        <RefreshCw size={12} />
        <span>Reintentar</span>
      </button>
    </div>
  );
}
