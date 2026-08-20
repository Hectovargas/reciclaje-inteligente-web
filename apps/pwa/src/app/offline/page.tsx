'use client';

import React from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, Recycle, Home } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="auth-wrapper">
      <div className="auth-container" style={{ maxWidth: '420px' }}>
        {/* Main Card */}
        <div className="auth-card" style={{ textAlign: 'center' }}>
          {/* Offline icon badge */}
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: '#ef4444',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.25)',
            }}
          >
            <WifiOff size={34} />
          </div>

          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
            Sin Conexión a Internet
          </h1>

          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
            No se ha podido conectar con el servicio de CleanCity. Tus datos se sincronizarán al recuperar la conexión a internet.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.75rem' }}>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              <RefreshCw size={16} />
              <span>Reintentar Conexión</span>
            </button>
            <Link
              href="/"
              className="btn-secondary"
            >
              <Home size={16} />
              <span>Volver a Inicio</span>
            </Link>
          </div>
        </div>

        {/* Brand footer */}
        <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.75rem' }}>
          <Recycle size={14} color="#10b981" />
          <span>CleanCity • Reciclaje Inteligente</span>
        </div>
      </div>
    </div>
  );
}
