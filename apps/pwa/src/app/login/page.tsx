'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Recycle, LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setLocalError(err?.message || 'Credenciales inválidas o error de conexión con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        {/* Main Card */}
        <div className="auth-card">
          {/* Logo & Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: '#070b14',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.45)',
                animation: 'pulseGlow 3s infinite ease-in-out',
              }}
            >
              <Recycle size={32} strokeWidth={2.4} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
              Iniciar Sesión
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.35rem', lineHeight: 1.4 }}>
              Ingresa a CleanCity y administra tus puntos de reciclaje
            </p>
          </div>

          {/* Feedback alert */}
          {(localError || error) && (
            <div className="alert-box alert-error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div className="form-group">
              <label className="form-label">
                Correo Electrónico
              </label>
              <div className="input-box">
                <Mail size={17} color="#64748b" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  required
                  className="form-input"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">
                  Contraseña
                </label>
              </div>
              <div className="input-box">
                <Lock size={17} color="#64748b" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="form-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input-icon-btn"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{ marginTop: '0.35rem' }}
            >
              {submitting ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid #04140d', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  <span>Ingresando...</span>
                </>
              ) : (
                <>
                  <LogIn size={17} strokeWidth={2.4} />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom links */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              ¿No tienes una cuenta aún?{' '}
              <Link href="/register" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none', marginLeft: '0.2rem' }}>
                Regístrate aquí
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
