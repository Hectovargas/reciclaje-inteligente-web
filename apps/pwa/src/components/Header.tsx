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
          padding: 'calc(10px + env(safe-area-inset-top, 0px)) 12px 10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(13, 17, 23, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(99, 231, 182, 0.12)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: 0,
            flexShrink: 1,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '32px',
              height: '32px',
              minWidth: '32px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.2), rgba(34, 211, 238, 0.2))',
              border: '1px solid rgba(99, 231, 182, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(99, 231, 182, 0.15)',
              flexShrink: 0,
            }}
          >
            <img
              src="/icon.svg"
              alt="CleanCity Logo"
              style={{
                width: '20px',
                height: '20px',
              }}
            />
          </div>
          <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ color: '#f0fdf4', fontWeight: 800, fontSize: '0.98rem', letterSpacing: '-0.03em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
              CleanCity
            </span>
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: 700,
                color: '#a3e635',
                background: 'rgba(163, 230, 53, 0.12)',
                border: '1px solid rgba(163, 230, 53, 0.25)',
                padding: '1px 4px',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
                flexShrink: 0,
              }}
            >
              PWA
            </span>
          </div>
        </Link>

        {/* User / Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {loading ? (
            <div style={{ padding: '4px 8px', color: 'rgba(240, 253, 244, 0.35)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              ...
            </div>
          ) : user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {user.role?.toUpperCase() === 'ADMIN' && (
                <Link
                  href="/admin"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 8px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(163, 230, 53, 0.1))',
                    border: '1px solid rgba(34, 211, 238, 0.35)',
                    color: '#22d3ee',
                    fontSize: '11px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 0 10px rgba(34, 211, 238, 0.12)',
                    whiteSpace: 'nowrap',
                  }}
                  title="Ir al Centro de Control Admin"
                >
                  <LayoutDashboard size={13} />
                  <span>Admin</span>
                </Link>
              )}

              <button
                onClick={() => setProfileOpen(true)}
                style={{
                  background: 'rgba(22, 32, 50, 0.75)',
                  color: '#f0fdf4',
                  border: '1px solid rgba(99, 231, 182, 0.2)',
                  padding: '4px 7px 4px 5px',
                  borderRadius: '9px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)',
                  maxWidth: '120px',
                }}
                title="Ver mi Perfil y Billetera"
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #a3e635, #22d3ee)',
                    color: '#06110a',
                    fontWeight: 800,
                    fontSize: '10.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '11.5px',
                    color: '#f0fdf4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '65px',
                  }}
                >
                  {user.name ? user.name.split(' ')[0] : 'Usuario'}
                </span>
                <ChevronDown size={11} color="rgba(240, 253, 244, 0.4)" style={{ flexShrink: 0 }} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '5px' }}>
              <Link
                href="/login"
                style={{
                  background: 'rgba(22, 32, 50, 0.7)',
                  color: '#f0fdf4',
                  border: '1px solid rgba(99, 231, 182, 0.15)',
                  padding: '5px 9px',
                  borderRadius: '7px',
                  fontSize: '11.5px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <LogIn size={12} />
                <span>Ingresar</span>
              </Link>
              <Link
                href="/register"
                style={{
                  background: 'linear-gradient(135deg, #a3e635, #10b981)',
                  color: '#06110a',
                  border: 'none',
                  padding: '5px 9px',
                  borderRadius: '7px',
                  fontSize: '11.5px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 800,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(163, 230, 53, 0.2)',
                  whiteSpace: 'nowrap',
                }}
              >
                <UserIcon size={12} />
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
