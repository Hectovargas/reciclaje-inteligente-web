'use client';

import React from 'react';
import { Station, getStatusConfig, getStationZoneName } from '../../config/api';

interface StationCardProps {
  station: Station;
  onClick: () => void;
  onEdit?: (station: Station) => void;
}

export function StationCard({ station, onClick, onEdit }: StationCardProps) {
  const s = getStatusConfig(station.status);
  const zoneName = getStationZoneName(station);

  const lastTelem = station.lastTelemetry || (station.telemetrias && station.telemetrias[0]);
  const papelLevel = lastTelem ? lastTelem.nivelPapel : Math.min(100, Math.round(station.capacity * 0.45));
  const plasticoLevel = lastTelem ? lastTelem.nivelPlastico : Math.min(100, Math.round(station.capacity * 0.35));
  const metalLevel = lastTelem ? lastTelem.nivelMetal : Math.min(100, Math.round(station.capacity * 0.2));
  const maxBinLevel = Math.max(papelLevel, plasticoLevel, metalLevel);

  const isOffline = station.status === 'OFFLINE' || station.status === 'offline';
  const isPending = station.status === 'PENDING_ACTIVATION' || station.status === 'pending_activation';

  const estHours = Math.max(1, Math.round((100 - maxBinLevel) / 8));
  const estMinutes = (maxBinLevel * 7) % 60;

  return (
    <div
      className={`glass-card ${s.ring}`}
      style={{
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={onClick}
    >
      {isPending && <div className="scan-line" />}

      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: s.color,
                boxShadow: `0 0 10px ${s.color}80`,
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: s.color, fontWeight: 700 }}>
              {station.id}
            </span>
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#f0fdf4',
              marginTop: 6,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {station.name}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(240,253,244,0.45)', marginTop: 2 }}>
            <span style={{ color: '#a3e635', fontWeight: 600 }}>{zoneName}</span> · {station.location}
          </div>
        </div>

        <div
          style={{
            padding: '4px 10px',
            borderRadius: 99,
            background: s.badgeBg,
            border: `1px solid ${s.color}50`,
            fontSize: 10,
            fontWeight: 700,
            color: s.color,
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {s.label}
        </div>
      </div>

      {/* MAC Address / Provisioning info */}
      {station.macAddress && (
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'rgba(240,253,244,0.45)',
          }}
        >
          <span>MAC:</span>
          <span style={{ color: '#22d3ee' }}>{station.macAddress}</span>
        </div>
      )}

      {/* Estimated Emptying or Status indicator */}
      {!isOffline && !isPending ? (
        <div
          style={{
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 10,
            background: maxBinLevel >= 80 ? 'rgba(251,191,36,0.08)' : 'rgba(34,211,238,0.05)',
            border: `1px solid ${maxBinLevel >= 80 ? 'rgba(251,191,36,0.3)' : 'rgba(34,211,238,0.15)'}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ flex: '1 1 110px' }}>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: 'rgba(240,253,244,0.4)',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
              }}
            >
              Vaciado aproximado
            </div>
            <div style={{ fontSize: 10.5, color: 'rgba(240,253,244,0.6)', marginTop: 2 }}>
              {maxBinLevel >= 80 ? '⚠ Llenado crítico' : 'Próxima recolección'}
            </div>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 15,
              fontWeight: 800,
              color: maxBinLevel >= 80 ? '#fbbf24' : '#22d3ee',
            }}
          >
            ~{estHours}h {estMinutes > 0 ? `${estMinutes}m` : ''}
          </div>
        </div>
      ) : isPending ? (
        <div
          style={{
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(56,189,248,0.08)',
            border: '1px solid rgba(56,189,248,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              Zero-Touch Pairing
            </div>
            <div style={{ fontSize: 10.5, color: 'rgba(240,253,244,0.6)' }}>Esperando primer ping</div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#38bdf8' }}>PENDING</div>
        </div>
      ) : (
        <div
          style={{
            marginTop: 14,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(239,68,68,0.8)', textTransform: 'uppercase' }}>
              Sin Conexión
            </div>
            <div style={{ fontSize: 10.5, color: 'rgba(240,253,244,0.4)' }}>Sin telemetría reciente</div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#ef4444' }}>OFFLINE</div>
        </div>
      )}

      {/* Ultrasonic Fill Bars for Compartments */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(99,231,182,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: 'rgba(240,253,244,0.4)',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
            }}
          >
            Nivel por Compartimento (IoT)
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#22d3ee' }}>
            {station.today || 0} eventos
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {[
            { label: 'Papel', val: papelLevel, color: '#a3e635' },
            { label: 'Plástico', val: plasticoLevel, color: '#22d3ee' },
            { label: 'Metal', val: metalLevel, color: '#a78bfa' },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                padding: '6px 8px',
                borderRadius: 8,
                background: 'rgba(11,16,26,0.5)',
                border: `1px solid ${m.val >= 80 ? '#fbbf24' : m.color}25`,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 8.5, color: 'rgba(240,253,244,0.5)', fontWeight: 600 }}>{m.label}</span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: m.val >= 80 ? '#fbbf24' : m.color,
                  }}
                >
                  {m.val}%
                </span>
              </div>
              <div style={{ height: 3, borderRadius: 1.5, background: 'rgba(240,253,244,0.08)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    borderRadius: 1.5,
                    width: `${Math.min(100, m.val)}%`,
                    background: m.val >= 80 ? '#fbbf24' : m.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(station);
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'rgba(240,253,244,0.5)',
              fontSize: 11,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ⚙ Editar
          </button>
        )}
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 10.5,
            color: '#22d3ee',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Ver detalle completo →
        </span>
      </div>
    </div>
  );
}
