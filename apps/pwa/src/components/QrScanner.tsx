'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, QrCode, Upload, Sparkles, AlertCircle, RefreshCw, CheckCircle, VideoOff } from 'lucide-react';
import type { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  isProcessing?: boolean;
}

export function QrScanner({ onScan, isProcessing = false }: QrScannerProps) {
  const [mode, setMode] = useState<'camera' | 'file' | 'manual'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [fileScanError, setFileScanError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerContainerId = 'html5-qr-reader';

  // Stop camera on unmount or mode switch
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanner = async (cameraId?: string) => {
    setCameraError(null);
    await stopScanner();

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      // Discover cameras
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          if (!selectedCameraId) {
            setSelectedCameraId(devices[0].id);
          }
        }
      } catch (e) {
        console.warn('Could not enumerate cameras:', e);
      }

      const cameraConfig = cameraId
        ? { deviceId: { exact: cameraId } }
        : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback
          handleSuccessScan(decodedText);
        },
        () => {
          // Frame error callback - ignore standard non-detection frames
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      const errMsg =
        err?.name === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Concede permisos para escanear.'
          : err?.name === 'NotFoundError'
          ? 'No se encontró ninguna cámara disponible en tu dispositivo.'
          : 'No se pudo iniciar la cámara en este navegador.';
      setCameraError(errMsg);
      setIsScanning(false);
    }
  };

  const handleSuccessScan = (text: string) => {
    if (isProcessing) return;

    // Optional haptic feedback
    if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
      try {
        window.navigator.vibrate(100);
      } catch {}
    }

    stopScanner();
    onScan(text);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileScanError(null);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('file-qr-temp');
      const decoded = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      handleSuccessScan(decoded);
    } catch (err: any) {
      console.warn('File scan error:', err);
      setFileScanError('No se detectó ningún código QR válido en la imagen seleccionada.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleSuccessScan(manualCode.trim());
    }
  };

  const handleDemoPreset = (material: string) => {
    const demoCode = `QR-${material.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setManualCode(demoCode);
    handleSuccessScan(demoCode);
  };

  return (
    <div className="scan-card">
      {/* Mode Switch Tabs */}
      <div
        style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '0.25rem',
          borderRadius: '12px',
          width: '100%',
          marginBottom: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          onClick={() => {
            setMode('camera');
            setFileScanError(null);
          }}
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '9px',
            border: 'none',
            background: mode === 'camera' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: mode === 'camera' ? '#10b981' : '#94a3b8',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            transition: 'all 0.2s',
          }}
        >
          <Camera size={14} />
          <span>Cámara</span>
        </button>

        <button
          onClick={() => {
            stopScanner();
            setMode('file');
          }}
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '9px',
            border: 'none',
            background: mode === 'file' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: mode === 'file' ? '#10b981' : '#94a3b8',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            transition: 'all 0.2s',
          }}
        >
          <Upload size={14} />
          <span>Subir QR</span>
        </button>

        <button
          onClick={() => {
            stopScanner();
            setMode('manual');
          }}
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '9px',
            border: 'none',
            background: mode === 'manual' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: mode === 'manual' ? '#10b981' : '#94a3b8',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            transition: 'all 0.2s',
          }}
        >
          <Sparkles size={14} />
          <span>Manual / Demo</span>
        </button>
      </div>

      {/* 1. Camera View */}
      {mode === 'camera' && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            id={scannerContainerId}
            style={{
              width: '100%',
              maxWidth: '320px',
              minHeight: isScanning ? '260px' : '0px',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#000',
              marginBottom: isScanning ? '1rem' : '0',
            }}
          />

          {!isScanning && (
            <div style={{ padding: '1rem 0', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: '#10b981',
                }}
              >
                <QrCode size={34} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
                Escáner QR en Tiempo Real
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.825rem', maxWidth: '300px', margin: '0 auto 1.25rem' }}>
                Apunta con la cámara al código QR que aparece en la pantalla OLED de la estación CleanCity.
              </p>
              <button
                className="btn-primary"
                onClick={() => startScanner(selectedCameraId)}
                disabled={isProcessing}
              >
                <Camera size={18} />
                <span>Activar Cámara</span>
              </button>
            </div>
          )}

          {isScanning && (
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '320px' }}>
              {cameras.length > 1 && (
                <button
                  onClick={() => {
                    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
                    const nextIndex = (currentIndex + 1) % cameras.length;
                    const nextCamera = cameras[nextIndex];
                    setSelectedCameraId(nextCamera.id);
                    startScanner(nextCamera.id);
                  }}
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '0.6rem 0.8rem',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Cambiar Cámara</span>
                </button>
              )}
              <button
                onClick={stopScanner}
                style={{
                  flex: 1,
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '0.6rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <VideoOff size={15} />
                <span>Detener</span>
              </button>
            </div>
          )}

          {cameraError && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                color: '#f87171',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                textAlign: 'left',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>
                <span>{cameraError}</span>
                <div style={{ marginTop: '0.25rem' }}>
                  <button
                    onClick={() => setMode('manual')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#06b6d4',
                      textDecoration: 'underline',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Usar modo manual o demo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. File Upload View */}
      {mode === 'file' && (
        <div style={{ width: '100%', textAlign: 'center', padding: '1rem 0' }}>
          <div id="file-qr-temp" style={{ display: 'none' }} />
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed rgba(16, 185, 129, 0.4)',
              borderRadius: '16px',
              padding: '2rem 1rem',
              cursor: 'pointer',
              background: 'rgba(16, 185, 129, 0.04)',
              transition: 'all 0.2s',
            }}
          >
            <Upload size={40} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Seleccionar foto o captura de QR
            </h4>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
              Toca aquí para buscar una imagen en tu galería
            </p>
          </div>

          {fileScanError && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.6rem 0.8rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <AlertCircle size={15} />
              <span>{fileScanError}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Manual / Demo View */}
      {mode === 'manual' && (
        <div style={{ width: '100%', textAlign: 'left' }}>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
              Código o Token QR:
            </label>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ej: QR-PLASTICO-1723680000-abcd1234"
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                padding: '0.75rem',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={!manualCode.trim() || isProcessing}
            >
              <CheckCircle size={16} />
              <span>Verificar y Procesar</span>
            </button>
          </form>

          {/* Quick Demo Buttons for Testnet / Lab testing */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
              DEMO PRESETS (SIMULACIÓN DE ESTACIÓN):
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {['Plastico', 'Metal', 'Papel', 'Vidrio'].map((mat) => (
                <button
                  key={mat}
                  type="button"
                  onClick={() => handleDemoPreset(mat)}
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    padding: '0.4rem 0.7rem',
                    color: '#10b981',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  +{mat === 'Metal' ? '15' : mat === 'Papel' ? '5' : mat === 'Vidrio' ? '8' : '10'} RECI ({mat})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
