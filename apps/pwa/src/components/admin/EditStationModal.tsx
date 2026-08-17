'use client';

import React, { useState, useEffect } from 'react';
import { Station, StationStatus, fetchWithAuth } from '../../config/api';

interface EditStationModalProps {
  station: Station;
  onClose: () => void;
  onUpdate: (updated: Station) => void;
  onDelete: (id: string) => void;
}

export function EditStationModal({ station, onClose, onUpdate, onDelete }: EditStationModalProps) {
  const initialZoneId = station.zoneId || (typeof station.zone === 'object' && station.zone ? station.zone.id : '');

  const [name, setName] = useState(station.name || '');
  const [location, setLocation] = useState(station.location || '');
  const [zoneId, setZoneId] = useState(initialZoneId || '');
  const [macAddress, setMacAddress] = useState(station.macAddress || '');
  const [capacity, setCapacity] = useState<number>(station.capacity || 100);
  const [status, setStatus] = useState<StationStatus>(station.status || 'ACTIVE');

  const [availableZones, setAvailableZones] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWithAuth('/zonas')
      .then((data: { id: string; name: string }[]) => {
        setAvailableZones(data || []);
        if (!zoneId && station.zone && typeof station.zone === 'object' && station.zone.id) {
          setZoneId(station.zone.id);
        } else if (!zoneId && typeof station.zone === 'string') {
          const match = data.find((z) => z.name === station.zone);
          if (match) setZoneId(match.id);
        }
      })
      .catch(() => {});
  }, [station, zoneId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la estación es requerido');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        name: name.trim(),
        location: location.trim() || 'Ubicación pendiente',
        capacity: Number(capacity) || 100,
        status: status.toUpperCase(),
      };

      if (zoneId) {
        payload.zoneId = zoneId;
      }

      if (macAddress.trim()) {
        payload.macAddress = macAddress.trim().toUpperCase();
      }

      const res = await fetchWithAuth(`/estaciones/${station.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const selectedZoneObj = availableZones.find((z) => z.id === (res.zoneId || zoneId));
      const updatedStation: Station = {
        ...station,
        ...res,
        zone: selectedZoneObj ? { id: selectedZoneObj.id, name: selectedZoneObj.name } : res.zone || station.zone,
      };

      onUpdate(updatedStation);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar la estación');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await fetchWithAuth(`/estaciones/${station.id}`, {
        method: 'DELETE',
      });
      onDelete(station.id);
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar la estación');
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: '28px 24px',
          width: 500,
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
              Editar Estación
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(240,253,244,0.45)', margin: '4px 0 0', fontFamily: 'var(--font-mono)' }}>
              ID: {station.id}
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

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,253,244,0.6)', display: 'block', marginBottom: 5 }}
            >
              Nombre de Estación *
            </label>
            <input
              type="text"
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
                Zona Urbana
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
                <option value="" style={{ background: '#0d1117' }}>
                  -- Sin Zona --
                </option>
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
                Estado Operativo
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StationStatus)}
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
                <option value="ACTIVE" style={{ background: '#0d1117' }}>
                  ACTIVE (Operativa)
                </option>
                <option value="WARNING" style={{ background: '#0d1117' }}>
                  WARNING (Alerta Llenado)
                </option>
                <option value="PENDING_ACTIVATION" style={{ background: '#0d1117' }}>
                  PENDING_ACTIVATION (Zero-Touch)
                </option>
                <option value="OFFLINE" style={{ background: '#0d1117' }}>
                  OFFLINE (Desconectada)
                </option>
              </select>
            </div>
          </div>

          <div>
            <label
              style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,253,244,0.6)', display: 'block', marginBottom: 5 }}
            >
              Ubicación
            </label>
            <input
              type="text"
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
                Dirección MAC
              </label>
              <input
                type="text"
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
                Capacidad (Lts)
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

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              style={{
                padding: '11px 16px',
                borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.4)',
                background: confirmDelete ? 'rgba(239,68,68,0.25)' : 'transparent',
                color: '#ef4444',
                fontWeight: 600,
                fontSize: 12,
                cursor: deleting ? 'not-allowed' : 'pointer',
              }}
            >
              {confirmDelete ? '¿Confirmar?' : 'Eliminar'}
            </button>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '11px 18px',
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
                padding: '11px 24px',
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
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
