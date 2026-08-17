'use client';

import React, { useState, useEffect } from 'react';
import { Station, fetchWithAuth } from '../../config/api';

interface AddStationModalProps {
  onClose: () => void;
  onAdd: (s: Station) => void;
}

export function AddStationModal({ onClose, onAdd }: AddStationModalProps) {
  const [name, setName] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [location, setLocation] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [capacity, setCapacity] = useState<number>(100);

  const [generatedToken, setGeneratedToken] = useState('');
  const [generatedProvToken, setGeneratedProvToken] = useState('');
  const [createdStationId, setCreatedStationId] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedProv, setCopiedProv] = useState(false);
  const [availableZones, setAvailableZones] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWithAuth('/zonas')
      .then((data: { id: string; name: string }[]) => {
        setAvailableZones(data || []);
        if (data && data.length > 0) {
          setZoneId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !zoneId) {
      setError('Nombre y Zona son campos requeridos.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        location: location.trim() || 'Ubicación pendiente',
        zoneId,
        capacity: Number(capacity) || 100,
      };

      if (macAddress.trim()) {
        payload.macAddress = macAddress.trim().toUpperCase();
      }

      const res = await fetchWithAuth('/estaciones', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const selectedZoneObj = availableZones.find((z) => z.id === zoneId);
      const newStation: Station = {
        ...res,
        zone: selectedZoneObj ? { id: selectedZoneObj.id, name: selectedZoneObj.name } : res.zone || zoneId,
      };

      setGeneratedToken(res.token);
      setGeneratedProvToken(res.provisioningToken || '');
      setCreatedStationId(res.id);
      onAdd(newStation);
    } catch (err: any) {
      setError(err?.message || 'Error al registrar la estación');
    } finally {
      setSaving(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(generatedToken).catch(() => {});
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const copyProvToken = () => {
    navigator.clipboard.writeText(generatedProvToken).catch(() => {});
    setCopiedProv(true);
    setTimeout(() => setCopiedProv(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: '28px 24px',
          width: 520,
          maxWidth: 'calc(100vw - 32px)',
          borderRadius: 20,
          background: 'rgba(13, 17, 23, 0.95)',
          border: '1px solid rgba(99,231,182,0.25)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f0fdf4', margin: 0, letterSpacing: '-0.03em' }}>
              Registrar Nueva Estación IoT
            </h2>
            <p style={{ fontSize: 12.5, color: 'rgba(240,253,244,0.45)', margin: '4px 0 0' }}>
              Aprovisionamiento Zero-Touch para microcontroladores ESP32
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'rgba(240,253,244,0.4)',
              fontSize: 20,
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171',
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        {generatedToken ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: 'rgba(52,211,153,0.1)',
                border: '1px solid rgba(52,211,153,0.3)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>✓ Estación Registrada con Éxito</div>
              <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.6)', marginTop: 4 }}>
                Identificador asignado:{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#f0fdf4', fontWeight: 700 }}>
                  {createdStationId}
                </span>
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(240,253,244,0.7)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Token de Telemetría (Auth Bearer)
              </label>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input
                  readOnly
                  value={generatedToken}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(22,32,50,0.8)',
                    border: '1px solid rgba(99,231,182,0.2)',
                    color: '#22d3ee',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={copyToken}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: copiedToken ? 'rgba(52,211,153,0.2)' : 'rgba(34,211,238,0.15)',
                    color: copiedToken ? '#34d399' : '#22d3ee',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {copiedToken ? 'Copiado ✓' : 'Copiar'}
                </button>
              </div>
            </div>

            {generatedProvToken && (
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(240,253,244,0.7)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Token de Aprovisionamiento (Zero-Touch)
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <input
                    readOnly
                    value={generatedProvToken}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(22,32,50,0.8)',
                      border: '1px solid rgba(99,231,182,0.2)',
                      color: '#a3e635',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={copyProvToken}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: copiedProv ? 'rgba(52,211,153,0.2)' : 'rgba(163,230,53,0.15)',
                      color: copiedProv ? '#34d399' : '#a3e635',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {copiedProv ? 'Copiado ✓' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '12px 0',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #a3e635, #22d3ee)',
                color: '#0d1117',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cerrar y Ver Estación
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(240,253,244,0.6)',
                  display: 'block',
                  marginBottom: 5,
                }}
              >
                Nombre de la Estación *
              </label>
              <input
                required
                type="text"
                placeholder="Ej. Estación Central UNITEC"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(22,32,50,0.6)',
                  border: '1px solid rgba(99,231,182,0.16)',
                  color: '#f0fdf4',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'rgba(240,253,244,0.6)',
                    display: 'block',
                    marginBottom: 5,
                  }}
                >
                  Zona Asignada *
                </label>
                <select
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(22,32,50,0.8)',
                    border: '1px solid rgba(99,231,182,0.16)',
                    color: '#f0fdf4',
                    fontSize: 13,
                    outline: 'none',
                  }}
                >
                  {availableZones.map((z) => (
                    <option key={z.id} value={z.id} style={{ background: '#0d1117' }}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'rgba(240,253,244,0.6)',
                    display: 'block',
                    marginBottom: 5,
                  }}
                >
                  Capacidad Total (Lts)
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(22,32,50,0.6)',
                    border: '1px solid rgba(99,231,182,0.16)',
                    color: '#f0fdf4',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(240,253,244,0.6)',
                  display: 'block',
                  marginBottom: 5,
                }}
              >
                Ubicación Detallada
              </label>
              <input
                type="text"
                placeholder="Ej. Frente a Cafetería Central, Edificio A"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(22,32,50,0.6)',
                  border: '1px solid rgba(99,231,182,0.16)',
                  color: '#f0fdf4',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(240,253,244,0.6)',
                  display: 'block',
                  marginBottom: 5,
                }}
              >
                Dirección MAC Física (Opcional - Zero Touch)
              </label>
              <input
                type="text"
                placeholder="Ej. 24:6F:28:XX:XX:XX"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(22,32,50,0.6)',
                  border: '1px solid rgba(99,231,182,0.16)',
                  color: '#22d3ee',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: 10,
                  border: '1px solid rgba(99,231,182,0.2)',
                  background: 'transparent',
                  color: 'rgba(240,253,244,0.7)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #a3e635, #22d3ee)',
                  color: '#0d1117',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Registrando...' : 'Registrar Estación'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
