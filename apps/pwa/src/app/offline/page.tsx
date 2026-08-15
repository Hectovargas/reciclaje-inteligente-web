'use client';

import React from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, Recycle, Home } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="pwa-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 700 }}>
          <Recycle size={22} />
          <span>CleanCity PWA</span>
        </div>
      </header>

      <main className="main-content" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <div
          style={{
            background: 'rgba(22, 31, 53, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '2.5rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
            }}
          >
            <WifiOff size={32} />
          </div>

          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            Sin Conexión a Internet
          </h2>

          <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '280px', lineHeight: 1.4 }}>
            No se ha podido establecer conexión con los servidores de CleanCity. La PWA mantendrá tu sesión en caché.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: '280px', marginTop: '0.5rem' }}>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
              style={{ flex: 1, padding: '0.7rem' }}
            >
              <RefreshCw size={15} />
              <span>Reintentar</span>
            </button>
            <Link
              href="/"
              style={{
                flex: 1,
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '0.7rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
              }}
            >
              <Home size={15} />
              <span>Inicio</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
