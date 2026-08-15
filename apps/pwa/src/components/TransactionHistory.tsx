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
              gap: '0.25rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <CheckCircle2 size={12} />
            <span>CONFIRMADO</span>
          </span>
        );
      case 'BATCHED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              background: 'rgba(147, 51, 234, 0.15)',
              color: '#c084fc',
              border: '1px solid rgba(147, 51, 234, 0.3)',
            }}
          >
            <Layers size={12} />
            <span>EN LOTE</span>
          </span>
        );
      case 'PENDING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <Clock size={12} />
            <span>EN COLA</span>
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <AlertCircle size={12} />
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
      style={{
        background: 'rgba(22, 31, 53, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} color="#06b6d4" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
            Historial de Recompensas
          </h3>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          style={{
            background: 'transparent',
            border: 'none',
            color: loading ? '#06b6d4' : '#94a3b8',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: loading ? 'spin 1s linear infinite' : 'none',
          }}
          title="Refrescar historial"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {loading && transactions.length === 0 && (
        <div style={{ padding: '1.5rem 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
          Cargando transacciones...
        </div>
      )}

      {error && (
        <div style={{ color: '#f87171', fontSize: '0.8rem', textAlign: 'center', padding: '0.5rem' }}>
          {error}
        </div>
      )}

      {!loading && transactions.length === 0 && !error && (
        <div
          style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            color: '#64748b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Award size={32} strokeWidth={1.5} color="#475569" />
          <p style={{ fontSize: '0.85rem', margin: 0 }}>
            Aún no tienes recompensas registradas.
          </p>
          <span style={{ fontSize: '0.75rem', color: '#475569' }}>
            Escanea tu primer código QR para recibir tokens RECI.
          </span>
        </div>
      )}

      {transactions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {transactions.map((tx) => (
            <div
              key={tx.id}
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                borderRadius: '12px',
                padding: '0.875rem',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={16} color="#10b981" />
                  <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.95rem' }}>
                    +{tx.amount} <span style={{ color: '#10b981', fontSize: '0.75rem' }}>RECI</span>
                  </span>
                </div>
                {getStatusBadge(tx.status)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                <span>{formatDate(tx.createdAt)}</span>
                {tx.txHash ? (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#06b6d4',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                    }}
                  >
                    <span>{`${tx.txHash.substring(0, 6)}...${tx.txHash.substring(tx.txHash.length - 4)}`}</span>
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <span style={{ color: '#64748b' }}>Batch BullMQ</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
