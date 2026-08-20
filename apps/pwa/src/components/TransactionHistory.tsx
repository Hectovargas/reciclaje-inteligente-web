'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, BlockchainTransaction } from '../types';
import { blockchainApi } from '../lib/api';
import {
  History,
  CheckCircle2,
  Clock,
  Layers,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Award,
  Link as LinkIcon,
} from 'lucide-react';

interface TransactionHistoryProps {
  user: User | null;
  refreshTrigger?: number;
}

export function TransactionHistory({ user, refreshTrigger = 0 }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user || !user.walletAddress) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await blockchainApi.getTransactions(user.walletAddress);
      setTransactions(data);
    } catch (err: any) {
      console.warn('Error fetching transactions:', err);
      setError('No se pudo cargar el historial de transacciones.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshTrigger]);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('es', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '6px',
              background: 'rgba(52, 211, 153, 0.12)',
              color: '#34d399',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              fontFamily: 'var(--font-mono)',
              boxShadow: '0 0 10px rgba(52, 211, 153, 0.1)',
            }}
          >
            <CheckCircle2 size={11} />
            <span>CONFIRMADO</span>
          </span>
        );
      case 'BATCHED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '6px',
              background: 'rgba(167, 139, 250, 0.12)',
              color: '#a78bfa',
              border: '1px solid rgba(167, 139, 250, 0.3)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Layers size={11} />
            <span>EN LOTE</span>
          </span>
        );
      case 'PENDING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '6px',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Clock size={11} />
            <span>EN COLA</span>
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <AlertCircle size={11} />
            <span>{status}</span>
          </span>
        );
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={15} color="#22d3ee" />
          <span className="tech-label" style={{ color: 'rgba(240, 253, 244, 0.5)' }}>
            Historial de Recompensas
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="tech-chip">
            {transactions.length} {transactions.length === 1 ? 'REG' : 'REGS'}
          </span>
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="btn-glass-icon"
            style={{ width: '28px', height: '28px', padding: 0 }}
            title="Refrescar historial on-chain"
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {loading && transactions.length === 0 && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'rgba(240, 253, 244, 0.4)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
          Consultando registros en la blockchain...
        </div>
      )}

      {error && (
        <div
          style={{
            color: '#fca5a5',
            fontSize: '12px',
            textAlign: 'center',
            padding: '10px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          {error}
        </div>
      )}

      {!loading && transactions.length === 0 && !error && (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: 'rgba(240, 253, 244, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(11, 16, 26, 0.4)',
            borderRadius: '12px',
            border: '1px dashed rgba(99, 231, 182, 0.15)',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(99, 231, 182, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(240, 253, 244, 0.3)',
              marginBottom: '2px',
            }}
          >
            <Award size={24} />
          </div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#f0fdf4', margin: 0 }}>
            Aún no tienes recompensas registradas.
          </p>
          <span style={{ fontSize: '11.5px', color: 'rgba(240, 253, 244, 0.45)', maxWidth: '280px', lineHeight: 1.4 }}>
            Escanea tu primer código QR para acumular puntos.
          </span>
        </div>
      )}

      {transactions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {transactions.map((tx) => (
            <div
              key={tx.id}
              style={{
                background: 'rgba(11, 16, 26, 0.65)',
                borderRadius: '12px',
                padding: '12px 14px',
                border: '1px solid rgba(99, 231, 182, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={15} color="#a3e635" />
                  <span style={{ color: '#f0fdf4', fontWeight: 800, fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                    +{tx.amount} <span style={{ color: '#a3e635', fontSize: '11px' }}>RECI</span>
                  </span>
                </div>
                {getStatusBadge(tx.status)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'rgba(240, 253, 244, 0.45)' }}>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{formatDate(tx.createdAt)}</span>
                {tx.txHash ? (
                  <span style={{ color: '#22d3ee', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                    <LinkIcon size={10} />
                    <span>{`${tx.txHash.substring(0, 6)}...${tx.txHash.substring(tx.txHash.length - 4)}`}</span>
                  </span>
                ) : (
                  <span style={{ color: 'rgba(240, 253, 244, 0.35)', fontFamily: 'var(--font-mono)' }}>En procesamiento</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
