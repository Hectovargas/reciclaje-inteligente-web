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
  Cpu,
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
    return '#a3e635'; // plastic / default
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn-glass-icon"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '28px',
            height: '28px',
            padding: 0,
            zIndex: 10,
          }}
        >
          <X size={15} />
        </button>

        {/* 1. Loading Verification State */}
        {verifying && (
          <div style={{ padding: '32px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '3px solid rgba(163, 230, 53, 0.15)',
                borderTopColor: '#a3e635',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#f0fdf4', fontWeight: 800 }}>Verificando Código QR</h3>
              <p style={{ color: 'rgba(240, 253, 244, 0.5)', fontSize: '0.8rem', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                Validando firma criptográfica con nodo...
              </p>
            </div>
          </div>
        )}

        {/* 2. Success Claimed State */}
        {!verifying && claimResult && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'radial-gradient(circle, rgba(163, 230, 53, 0.25) 0%, rgba(34, 211, 238, 0.1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: '#a3e635',
                border: '1px solid rgba(163, 230, 53, 0.4)',
                boxShadow: '0 0 24px rgba(163, 230, 53, 0.3)',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#a3e635',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                ¡Reclamo Exitoso!
              </span>
              <h2
                style={{
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  color: '#a3e635',
                  fontFamily: 'var(--font-mono)',
                  margin: '4px 0',
                  textShadow: '0 0 24px rgba(163, 230, 53, 0.4)',
                }}
              >
                +{claimResult.puntos} <span style={{ color: '#f0fdf4', fontSize: '1.2rem' }}>RECI</span>
              </h2>
              <p style={{ color: 'rgba(240, 253, 244, 0.6)', fontSize: '0.85rem' }}>
                Material reciclado: <strong style={{ color: '#f0fdf4' }}>{claimResult.material || 'Residuo'}</strong>
              </p>
            </div>

            {/* Status Box */}
            <div
              style={{
                background: 'rgba(11, 16, 26, 0.65)',
                borderRadius: '12px',
                padding: '12px 14px',
                border: '1px solid rgba(99, 231, 182, 0.12)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22d3ee', fontSize: '11px', fontWeight: 700 }}>
                  <Layers size={14} />
                  <span>Estado On-Chain:</span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    background: claimResult.txStatus === 'CONFIRMED' ? 'rgba(52,211,153,0.15)' : 'rgba(34,211,238,0.15)',
                    color: claimResult.txStatus === 'CONFIRMED' ? '#34d399' : '#22d3ee',
                    border: `1px solid ${claimResult.txStatus === 'CONFIRMED' ? 'rgba(52,211,153,0.3)' : 'rgba(34,211,238,0.3)'}`,
                  }}
                >
                  {claimResult.txStatus || 'COMPLETADO'}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(240, 253, 244, 0.5)', margin: 0, lineHeight: 1.35 }}>
                {claimResult.txStatus === 'QUEUED'
                  ? 'Tus puntos han sido registrados exitosamente en tu cuenta y encolados para batch minting.'
                  : 'Puntos acreditados exitosamente en la blockchain.'}
              </p>
            </div>

            <button
              className="btn-cyber-primary"
              onClick={onClose}
              style={{ marginTop: '4px' }}
            >
              <Sparkles size={16} />
              <span>Aceptar y Continuar</span>
            </button>
          </div>
        )}

        {/* 3. Verified & Ready to Claim State */}
        {!verifying && !claimResult && verificationResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'rgba(163, 230, 53, 0.12)',
                  color: '#a3e635',
                  border: '1px solid rgba(163, 230, 53, 0.25)',
                  fontSize: '11px',
                  fontWeight: 700,
                  marginBottom: '6px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <ShieldCheck size={13} />
                <span>Código de Reciclaje Válido</span>
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0fdf4', margin: 0, letterSpacing: '-0.02em' }}>
                Recompensa de Reciclaje
              </h3>
            </div>

            {/* Reward Preview Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(22, 32, 50, 0.8), rgba(11, 16, 26, 0.95))',
                borderRadius: '14px',
                padding: '16px',
                border: `1px solid ${getMaterialColor(verificationResult.material)}40`,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(240, 253, 244, 0.55)', fontSize: '12px' }}>Material Clasificado:</span>
                <span
                  style={{
                    color: getMaterialColor(verificationResult.material),
                    fontWeight: 800,
                    fontSize: '13px',
                    textTransform: 'capitalize',
                  }}
                >
                  {verificationResult.material}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(240, 253, 244, 0.55)', fontSize: '12px' }}>Puntos a Recibir:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={18} color="#a3e635" />
                  <span style={{ color: '#a3e635', fontWeight: 800, fontSize: '1.4rem', fontFamily: 'var(--font-mono)' }}>
                    +{verificationResult.puntos} <span style={{ color: '#f0fdf4', fontSize: '12px' }}>RECI</span>
                  </span>
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid rgba(99, 231, 182, 0.1)',
                  paddingTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'rgba(240, 253, 244, 0.4)',
                  fontSize: '11px',
                }}
              >
                <Clock size={12} />
                <span>Código: <code style={{ color: '#22d3ee', fontFamily: 'var(--font-mono)' }}>{verificationResult.codigo}</code></span>
              </div>
            </div>

            {/* Auth check */}
            {user ? (
              <button
                className="btn-cyber-primary"
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
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    <span>Acreditando puntos...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Reclamar Recompensa</span>
                  </>
                )}
              </button>
            ) : (
              <div
                style={{
                  background: 'rgba(34, 211, 238, 0.06)',
                  border: '1px solid rgba(34, 211, 238, 0.2)',
                  borderRadius: '12px',
                  padding: '14px',
                  textAlign: 'center',
                }}
              >
                <p style={{ color: '#f0fdf4', fontSize: '12px', marginBottom: '10px', fontWeight: 500 }}>
                  Inicia sesión para acumular estos puntos en tu cuenta.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link
                    href="/login"
                    onClick={onClose}
                    style={{
                      flex: 1,
                      background: 'rgba(22, 32, 50, 0.8)',
                      color: '#f0fdf4',
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      border: '1px solid rgba(99, 231, 182, 0.2)',
                    }}
                  >
                    <LogIn size={13} />
                    <span>Ingresar</span>
                  </Link>
                  <Link
                    href="/register"
                    onClick={onClose}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #a3e635, #10b981)',
                      color: '#06110a',
                      padding: '8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>Registrarse</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Error State */}
        {!verifying && error && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '14px', padding: '12px 0' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: '#ef4444',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)',
              }}
            >
              <AlertTriangle size={26} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f0fdf4' }}>
                No se pudo procesar el código
              </h3>
              <p style={{ color: '#fca5a5', fontSize: '12.5px', marginTop: '6px', lineHeight: 1.4 }}>
                {error}
              </p>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(22, 32, 50, 0.8)',
                color: '#f0fdf4',
                border: '1px solid rgba(99, 231, 182, 0.2)',
                padding: '10px',
                borderRadius: '10px',
                fontSize: '12.5px',
                cursor: 'pointer',
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
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
