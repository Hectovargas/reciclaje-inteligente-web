'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Recycle, LogIn, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setSubmitting(true);
    setLocalError(null);
    clearError();

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      console.warn('Login error:', err);
      setLocalError(err?.message || 'Credenciales inválidas o error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pwa-container">
      <header className="header">
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#94a3b8',
            textDecoration: 'none',
            fontSize: '0.85rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Volver al Inicio</span>
        </Link>
      </header>

      <main className="main-content" style={{ justifyContent: 'center' }}>
        <div
          style={{
            background: 'rgba(22, 31, 53, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}
        >
          {/* Logo & Title */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem',
                color: '#0a0f1d',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
              }}
            >
              <Recycle size={28} strokeWidth={2.5} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Iniciar Sesión
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.825rem', marginTop: '0.25rem' }}>
              Ingresa a CleanCity PWA y administra tus tokens RECI
            </p>
          </div>

          {(localError || error) && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                padding: '0.75rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#f87171',
                fontSize: '0.8rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{localError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.35rem', fontWeight: 500 }}>
                Correo Electrónico:
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '0 0.75rem',
                }}
              >
                <Mail size={16} color="#64748b" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  required
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '0.75rem 0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.35rem', fontWeight: 500 }}>
                Contraseña:
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '0 0.75rem',
                }}
              >
                <Lock size={16} color="#64748b" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '0.75rem 0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{ marginTop: '0.5rem' }}
            >
              {submitting ? (
                <span>Ingresando...</span>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
              ¿No tienes una cuenta aún?{' '}
              <Link href="/register" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>
                Regístrate aquí
              </Link>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
