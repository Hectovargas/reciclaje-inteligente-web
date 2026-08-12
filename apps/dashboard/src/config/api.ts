import { useState, useEffect } from 'react';

const API_URL = '/api/v1';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = '/'; // force re-login next time
    }
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export function useApi<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    
    async function loadData() {
      try {
        setLoading(true);
        const result = await fetchWithAuth(endpoint);
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    
    return () => { mounted = false; };
  }, [endpoint]);

  return { data, loading, error };
}

// Fallback definitions for empty database state
export const POOL: Array<{ type: string; station: string; material: string }> = []

export const MAT: Record<string, string> = {
  paper: '#a3e635', plastic: '#22d3ee', metal: '#a78bfa',
}

export const PEAK_RANGES = [
  { start: 8,  end: 10, label: 'Pico: 8h–10h' },
  { start: 11, end: 13, label: 'Pico: 11h–13h' },
  { start: 17, end: 19, label: 'Pico: 17h–19h' },
]

export const STATUS_CONFIG = {
  active: { label: 'Activa', color: '#34d399', ring: 'status-ring-active' },
  offline: { label: 'Desconectada', color: '#ef4444', ring: 'status-ring-offline' },
  warning: { label: 'Alerta', color: '#fbbf24', ring: 'status-ring-warning' },
}

export const ZONAS: string[] = []
export const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
export const MAX_VAL = 560
export const Y_TICKS = [0, 140, 280, 420, 560]
export const DATA = {
  paper:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  plastic: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  metal:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
}
export const SERIES = [
  { key: 'paper'   as const, color: '#a3e635', label: 'Papel' },
  { key: 'plastic' as const, color: '#22d3ee', label: 'Plástico' },
  { key: 'metal'   as const, color: '#a78bfa', label: 'Metal' },
]

export type Station = {
  id: string
  name: string
  location: string
  zone: string
  status: 'active' | 'offline' | 'warning'
  capacity: number
  today: number
  token: string
}

export function getStationFromZoneItem(s: { id: string; name: string; fill?: number; status: string; last?: string }, zoneName: string): Station {
  const cap = s.fill ?? 0
  const validStatus = (s.status === 'active' || s.status === 'offline' || s.status === 'warning') ? s.status : 'active'
  return {
    id: s.id,
    name: s.name,
    location: `${zoneName}`,
    zone: zoneName,
    status: validStatus as any,
    capacity: cap,
    today: 0,
    token: `tk_${s.id.toLowerCase().replace(/[^a-z0-9]/g, '')}_auth`,
  }
}
