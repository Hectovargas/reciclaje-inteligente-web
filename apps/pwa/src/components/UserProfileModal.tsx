'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { X, Copy, Check, LogOut, ShieldCheck, User as UserIcon, Mail, Cpu, LayoutDashboard, ChevronRight } from 'lucide-react';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #a3e635, #22d3ee)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#06110a',
                fontWeight: 800,
                fontSize: '16px',
                boxShadow: '0 0 16px rgba(163, 230, 53, 0.25)',
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f0fdf4', margin: 0, letterSpacing: '-0.02em' }}>
                {user.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span
                  style={{
                    fontSize: '9.5px',
                    color: '#a3e635',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    background: 'rgba(163, 230, 53, 0.1)',
                    border: '1px solid rgba(163, 230, 53, 0.25)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  ROL: {user.role || 'USER'}
                </span>
                <span className="pulse-dot" style={{ width: '4px', height: '4px' }} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-glass-icon"
            style={{ width: '30px', height: '30px', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* User Info HUD */}
        <div
          style={{
            background: 'rgba(11, 16, 26, 0.6)',
            borderRadius: '12px',
            padding: '12px 14px',
            border: '1px solid rgba(99, 231, 182, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(240, 253, 244, 0.6)', fontSize: '12px' }}>
            <Mail size={14} color="#22d3ee" />
            <span style={{ color: '#f0fdf4', fontWeight: 500 }}>{user.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(240, 253, 244, 0.6)', fontSize: '12px' }}>
            <UserIcon size={14} color="#a3e635" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(240, 253, 244, 0.7)' }}>
              UID: {user.id}
            </span>
          </div>
        </div>

        {/* Account / Custodial Box */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.06), rgba(163, 230, 53, 0.04))',
            border: '1px solid rgba(99, 231, 182, 0.2)',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} color="#34d399" />
              <span className="tech-label" style={{ color: '#34d399' }}>
                Dirección Custodial Web3
              </span>
            </div>
            <span className="tech-chip" style={{ fontSize: '9px', color: '#34d399' }}>
              On-Chain
            </span>
          </div>

          <div
            style={{
              background: '#0a0f1d',
              borderRadius: '8px',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              border: '1px solid rgba(99, 231, 182, 0.12)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#22d3ee',
                wordBreak: 'break-all',
                lineHeight: 1.3,
              }}
            >
              {user.walletAddress || 'Sin identificador asignado'}
            </span>
            {user.walletAddress && (
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? 'rgba(163, 230, 53, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  color: copied ? '#a3e635' : '#f0fdf4',
                  border: '1px solid rgba(99, 231, 182, 0.2)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  transition: 'all 0.2s',
                  flexShrink: 0,
                  fontFamily: 'var(--font-mono)',
                }}
                title="Copiar identificador"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Listo' : 'Copiar'}</span>
              </button>
            )}
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(240, 253, 244, 0.45)', margin: 0, lineHeight: 1.3 }}>
            Tus puntos y tokens de reciclaje se acreditan criptográficamente a esta dirección custodial.
          </p>
        </div>

        {/* Admin Dashboard shortcut if user is ADMIN */}
        {user.role?.toUpperCase() === 'ADMIN' && (
          <Link
            href="/admin"
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(163, 230, 53, 0.1))',
              border: '1px solid rgba(34, 211, 238, 0.35)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              color: '#22d3ee',
              transition: 'all 0.2s ease',
              boxShadow: '0 0 16px rgba(34, 211, 238, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(34, 211, 238, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LayoutDashboard size={17} color="#22d3ee" />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0fdf4' }}>
                  Panel Administrativo
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(240, 253, 244, 0.55)' }}>
                  Ir a EcoGridAI Admin Dashboard
                </div>
              </div>
            </div>
            <ChevronRight size={16} color="#22d3ee" />
          </Link>
        )}

        {/* Action Button */}
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '10px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <LogOut size={15} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
