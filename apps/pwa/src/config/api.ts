import { useState, useEffect, useCallback } from 'react';

function resolveConfigApiBase(): string {
  if (typeof window !== 'undefined') {
    // In browser, use relative path ("") so Next.js rewrites proxy all /api/v1/* requests
    // directly to the backend on the server side (eliminates CORS, port mismatch, and third-party cookie blocking)
    return '';
  }

  // Server-side execution (Node / SSR)
  let serverEnv = (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://backend:3000'
  ).trim().replace(/\/$/, '');

  if (serverEnv && !serverEnv.startsWith('http://') && !serverEnv.startsWith('https://')) {
    serverEnv = `https://${serverEnv}`;
  }

  return serverEnv;
}

const API_BASE = resolveConfigApiBase();
const API_URL = API_BASE ? `${API_BASE}/api/v1` : '/api/v1';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = normalizedEndpoint.startsWith('/api/v1')
    ? (API_BASE ? `${API_BASE}${normalizedEndpoint}` : normalizedEndpoint)
    : `${API_URL}${normalizedEndpoint}`;

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorDetail = `API error: ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson?.message) {
        errorDetail = Array.isArray(errJson.message) ? errJson.message.join(', ') : errJson.message;
      }
    } catch {
      // Ignore JSON parse error on non-json error responses
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export type UseApiOptions = {
  pollIntervalMs?: number;
  enabled?: boolean;
};

export function useApi<T>(endpoint: string, options: UseApiOptions = {}) {
  const { pollIntervalMs, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(
    async (isInitial = false) => {
      if (!enabled) return;
      try {
        if (isInitial) setLoading(true);
        const result = await fetchWithAuth(endpoint);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [endpoint, enabled]
  );

  useEffect(() => {
    let mounted = true;

    if (enabled) {
      loadData(true);
    }

    if (pollIntervalMs && pollIntervalMs > 0 && enabled) {
      const interval = setInterval(() => {
        if (mounted) loadData(false);
      }, pollIntervalMs);
      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }

    return () => {
      mounted = false;
    };
  }, [endpoint, pollIntervalMs, enabled, loadData]);

  const refetch = useCallback(() => loadData(false), [loadData]);

  return { data, loading, error, refetch, setData };
}

// Fallback definitions for empty database state
export const POOL: Array<{ type: string; station: string; material: string }> = [];

export const MAT: Record<string, string> = {
  paper: '#a3e635',
  plastic: '#22d3ee',
  metal: '#a78bfa',
  glass: '#34d399',
};

export const PEAK_RANGES = [
  { start: 8, end: 10, label: 'Pico: 8h–10h' },
  { start: 11, end: 13, label: 'Pico: 11h–13h' },
  { start: 17, end: 19, label: 'Pico: 17h–19h' },
];

export type StationStatus =
  | 'ACTIVE'
  | 'WARNING'
  | 'PENDING_ACTIVATION'
  | 'OFFLINE'
  | 'active'
  | 'warning'
  | 'pending_activation'
  | 'offline';

export type StatusConfigItem = {
  label: string;
  color: string;
  ring: string;
  badgeBg: string;
  description: string;
};

export const STATUS_CONFIG: Record<string, StatusConfigItem> = {
  ACTIVE: {
    label: 'Activa',
    color: '#34d399',
    ring: 'status-ring-active',
    badgeBg: 'rgba(52, 211, 153, 0.15)',
    description: 'Estación operativa y recibiendo clasificaciones',
  },
  active: {
    label: 'Activa',
    color: '#34d399',
    ring: 'status-ring-active',
    badgeBg: 'rgba(52, 211, 153, 0.15)',
    description: 'Estación operativa y recibiendo clasificaciones',
  },
  WARNING: {
    label: 'Alerta Llenado',
    color: '#fbbf24',
    ring: 'status-ring-warning',
    badgeBg: 'rgba(251, 191, 36, 0.15)',
    description: 'Capacidad ≥ 80%, requiere vaciado próximo',
  },
  warning: {
    label: 'Alerta Llenado',
    color: '#fbbf24',
    ring: 'status-ring-warning',
    badgeBg: 'rgba(251, 191, 36, 0.15)',
    description: 'Capacidad ≥ 80%, requiere vaciado próximo',
  },
  PENDING_ACTIVATION: {
    label: 'Pendiente Activación',
    color: '#38bdf8',
    ring: 'status-ring-pending',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    description: 'Esperando ping zero-touch del ESP32',
  },
  pending_activation: {
    label: 'Pendiente Activación',
    color: '#38bdf8',
    ring: 'status-ring-pending',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    description: 'Esperando ping zero-touch del ESP32',
  },
  OFFLINE: {
    label: 'Desconectada',
    color: '#ef4444',
    ring: 'status-ring-offline',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    description: 'Sin comunicación de telemetría',
  },
  offline: {
    label: 'Desconectada',
    color: '#ef4444',
    ring: 'status-ring-offline',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    description: 'Sin comunicación de telemetría',
  },
};

export function getStatusConfig(status?: string): StatusConfigItem {
  if (!status) return STATUS_CONFIG['OFFLINE'];
  const upper = status.toUpperCase();
  if (STATUS_CONFIG[upper]) return STATUS_CONFIG[upper];
  if (STATUS_CONFIG[status]) return STATUS_CONFIG[status];
  return {
    label: status,
    color: '#94a3b8',
    ring: '',
    badgeBg: 'rgba(148, 163, 184, 0.15)',
    description: 'Estado personalizado',
  };
}

export const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const MAX_VAL = 560;
export const Y_TICKS = [0, 140, 280, 420, 560];
export const DATA = {
  paper: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  plastic: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  metal: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};
export const SERIES = [
  { key: 'paper' as const, color: '#a3e635', label: 'Papel' },
  { key: 'plastic' as const, color: '#22d3ee', label: 'Plástico' },
  { key: 'metal' as const, color: '#a78bfa', label: 'Metal' },
];

export type TelemetryData = {
  id?: string;
  stationId?: string;
  nivelPapel: number;
  nivelPlastico: number;
  nivelMetal: number;
  bateria?: number | null;
  timestamp: string | Date;
};

export type Station = {
  id: string;
  name: string;
  location: string;
  zone?: { id: string; name: string; isActive?: boolean } | string | null;
  zoneId?: string;
  status: StationStatus;
  capacity: number;
  today: number;
  token: string;
  macAddress?: string | null;
  provisioningToken?: string | null;
  deviceSecret?: string | null;
  lastPingAt?: string | Date | null;
  lastTelemetry?: TelemetryData | null;
  telemetrias?: TelemetryData[];
  events?: any[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export function getStationZoneName(s: Station): string {
  if (!s) return 'Sin Zona';
  if (typeof s.zone === 'string') return s.zone;
  if (s.zone && typeof s.zone === 'object' && s.zone.name) return s.zone.name;
  return 'Sin Zona';
}

export function getStationFromZoneItem(
  s: { id: string; name: string; fill?: number; status: string; last?: string },
  zoneName: string
): Station {
  const cap = s.fill ?? 0;
  const validStatus =
    s.status === 'ACTIVE' ||
    s.status === 'WARNING' ||
    s.status === 'OFFLINE' ||
    s.status === 'PENDING_ACTIVATION' ||
    s.status === 'active' ||
    s.status === 'offline' ||
    s.status === 'warning'
      ? s.status
      : 'ACTIVE';
  return {
    id: s.id,
    name: s.name,
    location: `${zoneName}`,
    zone: zoneName,
    status: validStatus as StationStatus,
    capacity: cap,
    today: 0,
    token: '',
  };
}
