'use client';

import React, { useState, useEffect } from 'react';
import { QrVerificationResult, ClaimResult, User } from '../types';
import { qrApi, ApiError } from '../lib/api';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Award,
  Clock,
  Sparkles,
  Layers,
  ShieldCheck,
  LogIn,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  scannedCode: string | null;
  user: User | null;
  onClaimSuccess: () => void;
}

export function ClaimModal({
  isOpen,
  onClose,
  scannedCode,
  user,
  onClaimSuccess,
}: ClaimModalProps) {
  const [verifying, setVerifying] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [verificationResult, setVerificationResult] = useState<QrVerificationResult | null>(null);
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !scannedCode) {
      setVerificationResult(null);
      setClaimResult(null);
      setError(null);
      return;
    }

    const verifyCode = async () => {
      setVerifying(true);
      setError(null);
      setClaimResult(null);

      try {
        const result = await qrApi.verify(scannedCode);
        setVerificationResult(result);
      } catch (err: any) {
        console.warn('QR Verification error:', err);
        const msg =
          err instanceof ApiError
            ? err.message
            : err?.message || 'No se pudo verificar la firma o validez del código QR.';
        setError(msg);
      } finally {
        setVerifying(false);
      }
    };

    verifyCode();
  }, [isOpen, scannedCode]);

  if (!isOpen || !scannedCode) return null;

  const handleClaim = async () => {
    if (!user) return;
    setClaiming(true);
    setError(null);

    try {
      const result = await qrApi.claim(scannedCode);
      setClaimResult(result);
      onClaimSuccess();
    } catch (err: any) {
      console.warn('QR Claim error:', err);
      const msg =
        err instanceof ApiError
          ? err.message
          : err?.message || 'Error al procesar el reclamo de puntos.';
      setError(msg);
    } finally {
      setClaiming(false);
    }
  };

  const getMaterialColor = (material?: string) => {
    const mat = (material || '').toLowerCase();
    if (mat.includes('metal') || mat.includes('aluminio')) return '#f59e0b';
    if (mat.includes('papel') || mat.includes('cart')) return '#3b82f6';
    if (mat.includes('vidrio')) return '#06b6d4';
    return '#10b981'; // plastic / default
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
          borderRadius: '24px',
          width: '100%',
          maxWidth: '420px',
          padding: '1.75rem 1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '0.25rem',
          }}
        >
          <X size={20} />
        </button>

        {/* 1. Loading Verification State */}
        {verifying && (
          <div style={{ padding: '2rem 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '3px solid rgba(16, 185, 129, 0.2)',
                borderTopColor: '#10b981',
                animation: 'spin 1s linear infinite',
              }}
            />
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: 600 }}>Verificando Código QR</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Validando código de reciclaje...
              </p>
            </div>
          </div>
        )}

        {/* 2. Success Claimed State */}
        {!verifying && claimResult && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: '#10b981',
                border: '2px solid #10b981',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#10b981',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                ¡Reclamo Exitoso!
              </span>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', margin: '0.25rem 0' }}>
                +{claimResult.puntos} <span style={{ color: '#10b981' }}>RECI</span>
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                Material reciclado: <strong style={{ color: '#f8fafc' }}>{claimResult.material || 'Residuo'}</strong>
              </p>
            </div>

            {/* Status Box */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                borderRadius: '12px',
                padding: '0.875rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#06b6d4', fontSize: '0.8rem', fontWeight: 600 }}>
                  <Layers size={15} />
                  <span>Estado:</span>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    background: claimResult.txStatus === 'CONFIRMED' ? 'rgba(16,185,129,0.2)' : 'rgba(6,182,212,0.2)',
                    color: claimResult.txStatus === 'CONFIRMED' ? '#10b981' : '#06b6d4',
                  }}
                >
                  {claimResult.txStatus || 'COMPLETADO'}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                {claimResult.txStatus === 'QUEUED'
                  ? 'Tus puntos han sido registrados exitosamente en tu cuenta.'
                  : 'Puntos acreditados exitosamente.'}
              </p>
            </div>

            <button
              className="btn-primary"
              onClick={onClose}
              style={{ marginTop: '0.5rem' }}
            >
              <Sparkles size={16} />
              <span>Aceptar y Continuar</span>
            </button>
          </div>
        )}

        {/* 3. Verified & Ready to Claim State */}
        {!verifying && !claimResult && verificationResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '20px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                }}
              >
                <ShieldCheck size={14} />
                <span>Código de Reciclaje Válido</span>
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Recompensa de Reciclaje
              </h3>
            </div>

            {/* Reward Preview Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
                borderRadius: '16px',
                padding: '1.25rem',
                border: `1px solid ${getMaterialColor(verificationResult.material)}40`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Material Clasificado:</span>
                <span
                  style={{
                    color: getMaterialColor(verificationResult.material),
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    textTransform: 'capitalize',
                  }}
                >
                  {verificationResult.material}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Puntos a Recibir:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Award size={18} color="#10b981" />
                  <span style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.2rem' }}>
                    +{verificationResult.puntos} <span style={{ color: '#10b981', fontSize: '0.85rem' }}>RECI</span>
                  </span>
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: '#64748b',
                  fontSize: '0.75rem',
                }}
              >
                <Clock size={12} />
                <span>Código: <code style={{ color: '#cbd5e1' }}>{verificationResult.codigo}</code></span>
              </div>
            </div>

            {/* Auth check: Logged in vs Not logged in */}
            {user ? (
              <button
                className="btn-primary"
                onClick={handleClaim}
                disabled={claiming}
              >
                {claiming ? (
                  <>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '2px solid rgba(0,0,0,0.3)',
                        borderTopColor: '#000',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    <span>Acreditando puntos...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Reclamar Recompensa</span>
                  </>
                )}
              </button>
            ) : (
              <div
                style={{
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: '14px',
                  padding: '1rem',
                  textAlign: 'center',
                }}
              >
                <p style={{ color: '#f8fafc', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 500 }}>
                  Inicia sesión para acumular estos puntos en tu cuenta.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link
                    href="/login"
                    onClick={onClose}
                    style={{
                      flex: 1,
                      background: 'rgba(30, 41, 59, 0.9)',
                      color: '#f8fafc',
                      padding: '0.6rem',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <LogIn size={14} />
                    <span>Ingresar</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={onClose}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#0a0f1d',
                      padding: '0.6rem',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>Registrarse</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Error State */}
        {!verifying && error && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: '#ef4444',
              }}
            >
              <AlertTriangle size={30} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
                No se pudo procesar el código
              </h3>
              <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                {error}
              </p>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.7rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
