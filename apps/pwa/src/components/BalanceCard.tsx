'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Award, RefreshCw, Shield, AlertCircle, LogIn, Copy, Check, Leaf, Cpu } from 'lucide-react';
import { User, BalanceResponse } from '../types';
import { blockchainApi } from '../lib/api';
import Link from 'next/link';

interface BalanceCardProps {
  user: User | null;
  refreshTrigger?: number;
}

export function BalanceCard({ user, refreshTrigger = 0 }: BalanceCardProps) {
  const [balanceData, setBalanceData] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!user || !user.walletAddress) {
      setBalanceData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await blockchainApi.getBalance(user.walletAddress);
      setBalanceData(data);
    } catch (err: any) {
      console.warn('Error fetching blockchain balance:', err);
      setError(err?.message || 'No se pudo obtener el saldo on-chain');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance, refreshTrigger]);

  const rawBalanceNum = balanceData?.balance !== undefined ? parseFloat(balanceData.balance) : 0;
  const formattedBalance = balanceData?.balance !== undefined
    ? parseFloat(balanceData.balance).toFixed(1)
    : '0.0';

  const shortenAddress = (addr?: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const handleCopy = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '24px 20px',
          textAlign: 'center',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(163, 230, 53, 0.08) 0%, rgba(22, 32, 50, 0.7) 70%)',
          borderColor: 'rgba(99, 231, 182, 0.2)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.2), rgba(34, 211, 238, 0.15))',
            border: '1px solid rgba(99, 231, 182, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            color: '#a3e635',
            boxShadow: '0 0 20px rgba(163, 230, 53, 0.2)',
          }}
        >
          <Award size={26} />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f0fdf4', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Tu Billetera de Reciclaje
        </h3>
        <p style={{ color: 'rgba(240, 253, 244, 0.55)', fontSize: '0.85rem', maxWidth: '320px', margin: '0 auto 18px', lineHeight: 1.45 }}>
          Inicia sesión o regístrate para acumular tus puntos y recompensas de reciclaje en la red on-chain.
        </p>
        <Link
          href="/login"
          className="btn-cyber-primary"
          style={{ maxWidth: '240px', margin: '0 auto' }}
        >
          <LogIn size={16} />
          <span>Acceder a mi Cuenta</span>
        </Link>
      </div>
    );
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        background: 'linear-gradient(135deg, rgba(22, 32, 50, 0.8) 0%, rgba(13, 17, 23, 0.95) 100%)',
        borderColor: 'rgba(99, 231, 182, 0.22)',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="tech-label" style={{ color: 'rgba(240, 253, 244, 0.5)' }}>
            Saldo Acumulado · ERC-20
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="tech-chip">
            <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
            <span style={{ fontSize: '10px' }}>SEPOLIA L1</span>
          </div>
          <button
            onClick={fetchBalance}
            disabled={loading}
            className="btn-glass-icon"
            style={{ width: '28px', height: '28px', padding: 0 }}
            title="Actualizar balance on-chain"
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Main Balance Row */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', margin: '4px 0 2px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span
            style={{
              fontSize: '2.8rem',
              fontWeight: 800,
              color: '#a3e635',
              fontFamily: 'var(--font-mono)',
              lineHeight: 1,
              letterSpacing: '-0.04em',
              textShadow: '0 0 28px rgba(163, 230, 53, 0.45)',
            }}
          >
            {loading && !balanceData ? '...' : formattedBalance}
          </span>
          <span
            style={{
              background: 'rgba(163, 230, 53, 0.12)',
              border: '1px solid rgba(163, 230, 53, 0.3)',
              color: '#a3e635',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
            }}
          >
            {balanceData?.symbol || 'RECI'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Award size={20} color="#a3e635" style={{ filter: 'drop-shadow(0 0 8px rgba(163, 230, 53, 0.5))' }} />
        </div>
      </div>

      {/* Sub-Panel: Wallet Chip & Eco Stat */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '4px' }}>
        {/* Wallet Address HUD */}
        <div className="hud-sub-box">
          <span className="tech-label" style={{ fontSize: '8.5px' }}>Billetera Custodial</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginTop: '2px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#22d3ee', fontWeight: 600 }}>
              {shortenAddress(user.walletAddress)}
            </span>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? 'rgba(163, 230, 53, 0.2)' : 'transparent',
                border: 'none',
                color: copied ? '#a3e635' : 'rgba(240, 253, 244, 0.4)',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s',
              }}
              title="Copiar dirección"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        {/* Eco Impact HUD */}
        <div className="hud-sub-box">
          <span className="tech-label" style={{ fontSize: '8.5px' }}>Impacto Ambiental</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
            <Leaf size={13} color="#34d399" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#34d399', fontWeight: 700 }}>
              ~{(rawBalanceNum * 0.08).toFixed(1)} kg CO₂
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#f87171',
            fontSize: '11.5px',
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
