'use client';

import React, { useState } from 'react';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { X, Copy, Check, LogOut, ShieldCheck, User as UserIcon, Mail } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  const { logout } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (user.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 20, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '420px',
          padding: '1.5rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0a0f1d',
                fontWeight: 700,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                {user.name}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 500 }}>
                Rol: {user.role || 'USER'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            borderRadius: '12px',
            padding: '0.875rem',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            <Mail size={16} color="#06b6d4" />
            <span style={{ color: '#f8fafc' }}>{user.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            <UserIcon size={16} color="#10b981" />
            <span>ID: <code style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>{user.id}</code></span>
          </div>
        </div>

        {/* Custodial Wallet Box */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08))',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '14px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="#10b981" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981' }}>
                Wallet Custodial EVM (Ethereum / Sepolia)
              </span>
            </div>
            <span
              style={{
                fontSize: '0.65rem',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                padding: '0.15rem 0.4rem',
                borderRadius: '6px',
                fontWeight: 600,
              }}
            >
              AES-256 Cifrado
            </span>
          </div>

          <div
            style={{
              background: '#0a0f1d',
              borderRadius: '8px',
              padding: '0.6rem 0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: '#cbd5e1',
                wordBreak: 'break-all',
              }}
            >
              {user.walletAddress || 'Sin dirección asignada'}
            </span>
            {user.walletAddress && (
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                  color: copied ? '#0a0f1d' : '#f8fafc',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
                title="Copiar dirección"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            )}
          </div>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>
            Tus tokens RECI ganados se acumulan y mintean directamente en esta dirección custodial.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '0.75rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'background 0.2s',
          }}
        >
          <LogOut size={16} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
