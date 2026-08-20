'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User as UserIcon, LogIn, ChevronDown, LayoutDashboard, Shield } from 'lucide-react';
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
      <header
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(13, 17, 23, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(99, 231, 182, 0.12)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Brand */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.2), rgba(34, 211, 238, 0.2))',
              border: '1px solid rgba(99, 231, 182, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(99, 231, 182, 0.15)',
            }}
          >
            <img
              src="/icon.svg"
              alt="CleanCity Logo"
              style={{
                width: '24px',
                height: '24px',
              }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#f0fdf4', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                CleanCity
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#a3e635',
                  background: 'rgba(163, 230, 53, 0.12)',
                  border: '1px solid rgba(163, 230, 53, 0.25)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                }}
              >
                PWA
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
              <div className="pulse-dot" style={{ width: '5px', height: '5px' }} />
              <span style={{ color: 'rgba(240, 253, 244, 0.45)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Nodo Activo · Tiempo Real
              </span>
            </div>
          </div>
        </Link>

        {/* User / Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {loading ? (
            <div style={{ padding: '6px 12px', color: 'rgba(240, 253, 244, 0.35)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
              ...
            </div>
          ) : user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {user.role?.toUpperCase() === 'ADMIN' && (
                <Link
                  href="/admin"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(163, 230, 53, 0.1))',
                    border: '1px solid rgba(34, 211, 238, 0.35)',
                    color: '#22d3ee',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 0 12px rgba(34, 211, 238, 0.15)',
                  }}
                  title="Ir al Centro de Control Admin"
                >
                  <LayoutDashboard size={14} />
                  <span>Dashboard</span>
                </Link>
              )}

              <button
                onClick={() => setProfileOpen(true)}
                style={{
                  background: 'rgba(22, 32, 50, 0.7)',
                  color: '#f0fdf4',
                  border: '1px solid rgba(99, 231, 182, 0.2)',
                  padding: '5px 10px 5px 6px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)',
                }}
                title="Ver mi Perfil y Billetera"
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #a3e635, #22d3ee)',
                    color: '#06110a',
                    fontWeight: 800,
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: 1.1 }}>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: '#f0fdf4' }}>
                    {user.name ? user.name.split(' ')[0] : 'Usuario'}
                  </span>
                  {user.walletAddress && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', color: 'rgba(163, 230, 53, 0.8)' }}>
                      {shortenAddress(user.walletAddress)}
                    </span>
                  )}
                </div>
                <ChevronDown size={13} color="rgba(240, 253, 244, 0.4)" />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '6px' }}>
              <Link
                href="/login"
                style={{
                  background: 'rgba(22, 32, 50, 0.7)',
                  color: '#f0fdf4',
                  border: '1px solid rgba(99, 231, 182, 0.15)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                <LogIn size={13} />
                <span>Ingresar</span>
              </Link>
              <Link
                href="/register"
                style={{
                  background: 'linear-gradient(135deg, #a3e635, #10b981)',
                  color: '#06110a',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 800,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 10px rgba(163, 230, 53, 0.2)',
                }}
              >
                <UserIcon size={13} />
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
