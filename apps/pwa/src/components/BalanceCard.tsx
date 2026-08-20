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
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'linear-gradient(135deg, rgba(22, 32, 50, 0.8) 0%, rgba(13, 17, 23, 0.95) 100%)',
        borderColor: 'rgba(99, 231, 182, 0.22)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="tech-label" style={{ color: 'rgba(240, 253, 244, 0.5)' }}>
            Saldo Acumulado
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={fetchBalance}
            disabled={loading}
            className="btn-glass-icon"
            style={{ width: '26px', height: '26px', padding: 0 }}
            title="Actualizar balance on-chain"
          >
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Main Balance Row */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', minWidth: 0 }}>
          <span
            style={{
              fontSize: 'clamp(2.2rem, 7.5vw, 2.7rem)',
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
              padding: '2px 6px',
              borderRadius: '5px',
              fontSize: '10.5px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
              flexShrink: 0,
            }}
          >
            {balanceData?.symbol || 'RECI'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <Award size={18} color="#a3e635" style={{ filter: 'drop-shadow(0 0 8px rgba(163, 230, 53, 0.5))' }} />
        </div>
      </div>

      {/* Sub-Panel: Wallet Chip & Eco Stat */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '6px', paddingTop: '2px' }}>
        {/* Wallet Address HUD */}
        <div className="hud-sub-box" style={{ minWidth: 0 }}>
          <span className="tech-label" style={{ fontSize: '8px' }}>Billetera Custodial</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2px', marginTop: '2px', minWidth: 0 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(9.5px, 2.7vw, 11px)',
                color: '#22d3ee',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {shortenAddress(user.walletAddress)}
            </span>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? 'rgba(163, 230, 53, 0.2)' : 'transparent',
                border: 'none',
                color: copied ? '#a3e635' : 'rgba(240, 253, 244, 0.4)',
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              title="Copiar dirección"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </div>
        </div>

        {/* Eco Impact HUD */}
        <div className="hud-sub-box" style={{ minWidth: 0 }}>
          <span className="tech-label" style={{ fontSize: '8px' }}>Impacto Ambiental</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', minWidth: 0 }}>
            <Leaf size={12} color="#34d399" style={{ flexShrink: 0 }} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(9.5px, 2.7vw, 11px)',
                color: '#34d399',
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {Math.round(rawBalanceNum)} unidades
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
