'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, QrCode, Upload, AlertCircle, RefreshCw, VideoOff } from 'lucide-react';
import type { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  isProcessing?: boolean;
}

export function QrScanner({ onScan, isProcessing = false }: QrScannerProps) {
  const [mode, setMode] = useState<'camera' | 'file'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [fileScanError, setFileScanError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerContainerId = 'html5-qr-reader';

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
          handleSuccessScan(decodedText);
        },
        () => {
          // Frame error callback
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

  return (
    <div
      className="glass-card"
      style={{
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Mode Switch Tabs */}
      <div className="glass-tabs" style={{ boxSizing: 'border-box' }}>
        <button
          className={`glass-tab-btn ${mode === 'camera' ? 'active' : ''}`}
          style={{ minWidth: 0, padding: '7px 8px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
          onClick={() => {
            setMode('camera');
            setFileScanError(null);
          }}
        >
          <Camera size={13} />
          <span>Cámara</span>
        </button>

        <button
          className={`glass-tab-btn ${mode === 'file' ? 'active' : ''}`}
          style={{ minWidth: 0, padding: '7px 8px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
          onClick={() => {
            stopScanner();
            setMode('file');
          }}
        >
          <Upload size={13} />
          <span>Subir QR</span>
        </button>
      </div>

      {/* 1. Camera View */}
      {mode === 'camera' && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
          {/* Active Camera Element */}
          <div
            id={scannerContainerId}
            style={{
              width: '100%',
              maxWidth: '340px',
              minHeight: isScanning ? '280px' : '0px',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#000',
              marginBottom: isScanning ? '12px' : '0',
              position: 'relative',
              display: isScanning ? 'block' : 'none',
              border: '1px solid rgba(99, 231, 182, 0.3)',
            }}
          />

          {/* Idle Camera HUD Viewfinder */}
          {!isScanning && (
            <div className="viewfinder-container" style={{ width: '100%', maxWidth: '340px', boxSizing: 'border-box' }}>
              <div className="viewfinder-hud" style={{ padding: '20px 12px', minHeight: '200px' }}>
                <div className="vf-grid" />
                <div className="vf-corner vf-tl" />
                <div className="vf-corner vf-tr" />
                <div className="vf-corner vf-bl" />
                <div className="vf-corner vf-br" />
                <div className="laser-scan-line" style={{ left: '8px', right: '8px' }} />

                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: 'radial-gradient(circle, rgba(163, 230, 53, 0.2) 0%, rgba(34, 211, 238, 0.08) 100%)',
                    border: '1px solid rgba(163, 230, 53, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px',
                    color: '#a3e635',
                    boxShadow: '0 0 24px rgba(163, 230, 53, 0.25)',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <QrCode size={28} />
                </div>

                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: '#f0fdf4',
                    marginBottom: '4px',
                    letterSpacing: '-0.02em',
                    position: 'relative',
                    zIndex: 2,
                    textAlign: 'center',
                  }}
                >
                  Escáner QR en Tiempo Real
                </h3>
                <p
                  style={{
                    color: 'rgba(240, 253, 244, 0.55)',
                    fontSize: '0.78rem',
                    maxWidth: '260px',
                    margin: '0 auto 14px',
                    textAlign: 'center',
                    lineHeight: 1.35,
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  Apunta con la cámara al código QR que aparece en la pantalla de la estación de reciclaje.
                </p>

                <button
                  className="btn-cyber-primary"
                  onClick={() => startScanner(selectedCameraId)}
                  disabled={isProcessing}
                  style={{ position: 'relative', zIndex: 2, maxWidth: '220px', padding: '10px 16px', fontSize: '13px' }}
                >
                  <Camera size={15} />
                  <span>Activar Cámara</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Camera Controls */}
          {isScanning && (
            <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '340px' }}>
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
                    background: 'rgba(22, 32, 50, 0.8)',
                    color: '#f0fdf4',
                    border: '1px solid rgba(99, 231, 182, 0.2)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Cambiar Cámara</span>
                </button>
              )}
              <button
                onClick={stopScanner}
                style={{
                  flex: 1,
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-sans)',
                  boxShadow: '0 0 16px rgba(239, 68, 68, 0.15)',
                }}
              >
                <VideoOff size={14} />
                <span>Detener</span>
              </button>
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                color: '#fca5a5',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'left',
                width: '100%',
                maxWidth: '340px',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Micro-Guide Steps */}
          {!isScanning && (
            <div className="steps-container">
              <div className="step-card">
                <span className="step-badge step-badge-1">1</span>
                <span className="step-label">Deposita material</span>
              </div>
              <div className="step-card">
                <span className="step-badge step-badge-2">2</span>
                <span className="step-label">Clasificación IA</span>
              </div>
              <div className="step-card">
                <span className="step-badge step-badge-3">3</span>
                <span className="step-label">Escanea código</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. File Upload View */}
      {mode === 'file' && (
        <div style={{ width: '100%', textAlign: 'center' }}>
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
              border: '2px dashed rgba(99, 231, 182, 0.35)',
              borderRadius: '16px',
              padding: '28px 16px',
              cursor: 'pointer',
              background: 'radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.04) 0%, rgba(13, 17, 23, 0.8) 100%)',
              transition: 'all 0.25s ease',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(34, 211, 238, 0.1)',
                border: '1px solid rgba(34, 211, 238, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: '#22d3ee',
              }}
            >
              <Upload size={26} />
            </div>
            <h4 style={{ color: '#f0fdf4', fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
              Seleccionar foto o captura de QR
            </h4>
            <p style={{ color: 'rgba(240, 253, 244, 0.5)', fontSize: '0.8rem', margin: '0 auto 10px', maxWidth: '260px' }}>
              Toca aquí para buscar una imagen en tu galería de fotos
            </p>
            <div style={{ display: 'inline-flex', gap: '5px' }}>
              <span className="tech-chip" style={{ fontSize: '9.5px' }}>PNG</span>
              <span className="tech-chip" style={{ fontSize: '9.5px' }}>JPG</span>
              <span className="tech-chip" style={{ fontSize: '9.5px' }}>WEBP</span>
            </div>
          </div>

          {fileScanError && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                color: '#fca5a5',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textAlign: 'left',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{fileScanError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
