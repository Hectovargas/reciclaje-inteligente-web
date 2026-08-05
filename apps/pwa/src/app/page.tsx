'use client';

import React, { useState } from 'react';
import { QrCode, Wallet, Award, Recycle, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [scannedToken, setScannedToken] = useState<string | null>(null);

  const handleConnectWallet = () => {
    setWalletConnected(true);
  };

  const handleSimulateScan = () => {
    setScannedToken('QR-PLASTICO-982347');
  };

  return (
    <div className="pwa-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 700 }}>
          <Recycle size={24} />
          <span>ReciclajePWA</span>
        </div>
        <button
          onClick={handleConnectWallet}
          style={{
            background: walletConnected ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
            color: walletConnected ? '#10b981' : '#f8fafc',
            border: '1px solid ' + (walletConnected ? '#10b981' : 'rgba(255,255,255,0.1)'),
            padding: '0.5rem 0.875rem',
            borderRadius: '10px',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            align-items: 'center',
            gap: '0.4rem',
          }}
        >
          <Wallet size={16} />
          {walletConnected ? '0x71C...4f9' : 'Conectar Web3'}
        </button>
      </header>

      <main className="main-content">
        <div className="wallet-card">
          <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Balance PuntosReciclaje</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <Award size={28} color="#10b981" />
            <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>150.0 <span style={{ fontSize: '1rem', color: '#10b981' }}>RECI</span></h2>
          </div>
        </div>

        <div className="scan-card">
          <QrCode size={64} color="#10b981" />
          <h3>Escanea tu Código QR</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Apunta con la cámara al código QR impreso en el contenedor inteligente
          </p>
          <button className="btn-primary" onClick={handleSimulateScan}>
            <QrCode size={18} /> Escanear QR
          </button>

          {scannedToken && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
              <CheckCircle2 size={18} /> Token Escaneado: {scannedToken}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
