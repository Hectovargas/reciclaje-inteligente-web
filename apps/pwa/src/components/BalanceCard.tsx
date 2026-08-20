'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Award, RefreshCw, Copy, Check, Shield, AlertCircle, LogIn } from 'lucide-react';
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
      // If error, show message or fallback
      setError(err?.message || 'No se pudo obtener el saldo on-chain');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance, refreshTrigger]);

  const handleCopy = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortenAddress = (addr?: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const formattedBalance = balanceData?.balance !== undefined
    ? parseFloat(balanceData.balance).toFixed(1)
    : '0.0';

  if (!user) {
    return (
      <div
        className="wallet-card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
          textAlign: 'center',
          padding: '1.5rem 1rem',
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem',
            color: '#10b981',
          }}
        >
          <Award size={24} />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.35rem' }}>
          Tu Billetera de Reciclaje
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.825rem', marginBottom: '1rem' }}>
          Inicia sesión o regístrate para acumular tus puntos y recompensas de reciclaje.
        </p>
        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            color: '#0a0f1d',
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <LogIn size={16} />
          <span>Acceder a mi Cuenta</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="wallet-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Shield size={15} color="#10b981" />
          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500 }}>
            Saldo Acumulado
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={fetchBalance}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: loading ? '#10b981' : '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: loading ? 'spin 1s linear infinite' : 'none',
            }}
            title="Actualizar balance"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.25rem 0 1rem' }}>
        <Award size={32} color="#10b981" style={{ alignSelf: 'center' }} />
        <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em', lineHeight: 1 }}>
          {loading && !balanceData ? '...' : formattedBalance}
        </h2>
        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>
          {balanceData?.symbol || 'RECI'}
        </span>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#f87171',
            fontSize: '0.75rem',
          }}
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {user.walletAddress && (
        <div
          style={{
            background: 'rgba(10, 15, 29, 0.6)',
            borderRadius: '10px',
            padding: '0.5rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ID de Cuenta:</span>
            <code style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>
              {shortenAddress(user.walletAddress)}
            </code>
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
              color: copied ? '#0a0f1d' : '#94a3b8',
              border: 'none',
              borderRadius: '6px',
              padding: '0.25rem 0.45rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
