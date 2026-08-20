'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Recycle, UserPlus, Mail, Lock, User as UserIcon, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setLocalError('Todos los campos son obligatorios.');
      return;
    }

    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    setLocalError(null);
    clearError();

    try {
      const registeredUser = await register(email, password, name);
      if (registeredUser?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/app');
      }
    } catch (err: any) {
      console.warn('Registration error:', err);
      setLocalError(err?.message || 'Error al crear la cuenta. Intenta con otro correo electrónico.');
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
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
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
              Crear Cuenta Ciudadana
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.35rem', lineHeight: 1.4 }}>
              Crea tu cuenta y empieza a acumular puntos por reciclar
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="form-group">
              <label className="form-label">
                Nombre Completo
              </label>
              <div className="input-box">
                <UserIcon size={17} color="#64748b" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Carlos Silva"
                  required
                  className="form-input"
                  autoComplete="name"
                />
              </div>
            </div>

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
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Mín. 6 caracteres</span>
              </div>
              <div className="input-box">
                <Lock size={17} color="#64748b" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="form-input"
                  autoComplete="new-password"
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
              style={{ marginTop: '0.5rem' }}
            >
              {submitting ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid #04140d', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <UserPlus size={17} strokeWidth={2.4} />
                  <span>Crear Cuenta</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom links */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none', marginLeft: '0.2rem' }}>
                Inicia sesión aquí
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
