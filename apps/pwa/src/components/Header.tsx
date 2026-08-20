'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Recycle, Wallet, User as UserIcon, LogIn, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfileModal } from './UserProfileModal';

export function Header() {
  const { user, loading } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const shortenAddress = (addr?: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <>
      <header className="header">
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              borderRadius: '10px',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Recycle size={22} color="#0a0f1d" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              CleanCity
            </div>
            <div style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em' }}>
              RECICLAJE INTELIGENTE
            </div>
          </div>
        </Link>

        <div>
          {loading ? (
            <div style={{ padding: '0.5rem 0.8rem', color: '#64748b', fontSize: '0.85rem' }}>
              Cargando...
            </div>
          ) : user ? (
            <button
              onClick={() => setProfileOpen(true)}
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.45rem 0.8rem',
                borderRadius: '12px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease',
              }}
              title="Ver mi Perfil"
            >
              <UserIcon size={15} />
              <span style={{ fontWeight: 600 }}>
                {user.name ? user.name.split(' ')[0] : shortenAddress(user.walletAddress)}
              </span>
              <ChevronDown size={14} />
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link
                href="/login"
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  color: '#f8fafc',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 500,
                }}
              >
                <LogIn size={14} />
                <span>Ingresar</span>
              </Link>
              <Link
                href="/register"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#0a0f1d',
                  border: 'none',
                  padding: '0.45rem 0.8rem',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 700,
                }}
              >
                <UserIcon size={14} />
                <span>Registro</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {user && (
        <UserProfileModal
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          user={user}
        />
      )}
    </>
  );
}
