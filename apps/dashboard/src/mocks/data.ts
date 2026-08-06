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
  const existing = INITIAL_STATIONS.find(item => item.id === s.id)
  if (existing) return existing

  const cap = s.fill ?? 60
  const validStatus = (s.status === 'active' || s.status === 'offline' || s.status === 'warning') ? s.status : 'active'
  return {
    id: s.id,
    name: s.name,
    location: `${zoneName}`,
    zone: zoneName,
    status: validStatus,
    capacity: cap,
    today: Math.round(cap * 4.2),
    token: `tk_${s.id.toLowerCase().replace(/[^a-z0-9]/g, '')}_auth`,
  }
}

export const FEED_INIT = [
  { id: 1, type: 'Papel',    station: 'ES-042', time: 'hace 12s', material: 'paper' },
  { id: 2, type: 'Plástico', station: 'ES-018', time: 'hace 38s', material: 'plastic' },
  { id: 3, type: 'Metal',    station: 'ES-055', time: 'hace 2m',  material: 'metal' },
  { id: 4, type: 'Papel',    station: 'ES-007', time: 'hace 3m',  material: 'paper' },
  { id: 5, type: 'Plástico', station: 'ES-033', time: 'hace 4m',  material: 'plastic' },
  { id: 6, type: 'Metal',    station: 'ES-021', time: 'hace 5m',  material: 'metal' },
  { id: 7, type: 'Papel',    station: 'ES-011', time: 'hace 6m',  material: 'paper' },
]

export const POOL = [
  { type: 'Metal',    station: 'ES-012', material: 'metal' },
  { type: 'Plástico', station: 'ES-076', material: 'plastic' },
  { type: 'Papel',    station: 'ES-044', material: 'paper' },
  { type: 'Metal',    station: 'ES-088', material: 'metal' },
]

export const MAT: Record<string, string> = {
  paper: '#a3e635', plastic: '#22d3ee', metal: '#a78bfa',
}

export const ZONES = [
  {
    id: 'unitec', name: 'UNITEC', value: 34, todayCount: 6266, prevCount: 5800,
    stations: [
      { id: 'ES-042', name: 'Plaza Principal UNITEC', fill: 94, status: 'active',  last: 'Papel' },
      { id: 'ES-018', name: 'Edificio 2 UNITEC',     fill: 78, status: 'active',  last: 'Plástico' },
      { id: 'ES-055', name: 'Cafetería UNITEC',      fill: 61, status: 'active',  last: 'Metal' },
    ],
  },
  {
    id: 'altara', name: 'Altara', value: 22, todayCount: 4055, prevCount: 3900,
    stations: [
      { id: 'ES-011', name: 'Entrada Altara',        fill: 78, status: 'active',  last: 'Papel' },
      { id: 'ES-022', name: 'Food Court Altara',     fill: 52, status: 'active',  last: 'Metal' },
    ],
  },
  {
    id: 'altia', name: 'Altia', value: 18, todayCount: 3317, prevCount: 3450,
    stations: [
      { id: 'ES-033', name: 'Torre 1 Altia',         fill: 61, status: 'active',  last: 'Plástico' },
      { id: 'ES-044', name: 'Plaza Altia',           fill: 39, status: 'active',  last: 'Papel' },
    ],
  },
  {
    id: 'city-mall', name: 'City Mall', value: 15, todayCount: 2764, prevCount: 2600,
    stations: [
      { id: 'ES-077', name: 'Nivel 1 City Mall',     fill: 85, status: 'active',  last: 'Plástico' },
      { id: 'ES-088', name: 'Cines City Mall',       fill: 71, status: 'warning', last: 'Metal' },
    ],
  },
  {
    id: 'mall-galerias', name: 'Mall Galerias', value: 7, todayCount: 1290, prevCount: 1100,
    stations: [
      { id: 'ES-099', name: 'Acceso Galerias',       fill: 43, status: 'active',  last: 'Papel' },
      { id: 'ES-101', name: 'Comidas Galerias',      fill: 12, status: 'offline', last: '—' },
    ],
  },
  {
    id: 'mega-mall', name: 'Mega Mall', value: 4, todayCount: 740, prevCount: 700,
    stations: [
      { id: 'ES-112', name: 'Sótano Mega Mall',      fill: 29, status: 'active',  last: 'Metal' },
    ],
  },
]

export const TOP3 = [
  { id: 'ES-042', name: 'Plaza Principal UNITEC', fill: 94 },
  { id: 'ES-077', name: 'Nivel 1 City Mall',      fill: 85 },
  { id: 'ES-011', name: 'Entrada Altara',         fill: 78 },
]

export const STATUS_DOT: Record<string, string> = {
  active: '#34d399', warning: '#fbbf24', offline: '#ef4444',
}

export const PEAK_DATA = {
  hoy: [12,8,5,3,4,9,18,42,61,74,82,88,95,91,78,65,70,84,76,55,38,28,19,14],
  semana: [10,7,4,3,4,8,22,48,67,79,85,90,92,89,82,72,75,86,80,62,44,32,22,15],
}

export const PEAK_RANGES = [
  { start: 8,  end: 10, label: 'Pico: 8h–10h' },
  { start: 11, end: 13, label: 'Pico: 11h–13h' },
  { start: 17, end: 19, label: 'Pico: 17h–19h' },
]

export const INITIAL_STATIONS: Station[] = [
  { id: 'ES-042', name: 'Plaza Principal UNITEC', zone: 'UNITEC', location: 'Campus UNITEC', status: 'active', capacity: 87, today: 234, token: 'tk_a9f2bc41e7d3' },
  { id: 'ES-018', name: 'Edificio 2 UNITEC', zone: 'UNITEC', location: 'Campus UNITEC', status: 'active', capacity: 62, today: 189, token: 'tk_e3b1c90d4f82' },
  { id: 'ES-091', name: 'Food Court Altara', zone: 'Altara', location: 'Comedores Nivel 2', status: 'warning', capacity: 95, today: 312, token: 'tk_77d4a12fe6c3' },
  { id: 'ES-055', name: 'Torre 1 Altia', zone: 'Altia', location: 'Lobby Principal', status: 'active', capacity: 41, today: 156, token: 'tk_c2f9e05b3a74' },
  { id: 'ES-007', name: 'Nivel 1 City Mall', zone: 'City Mall', location: 'Entrada Sur', status: 'offline', capacity: 0, today: 0, token: 'tk_5e8b2d1f9c05' },
  { id: 'ES-033', name: 'Acceso Galerias', zone: 'Mall Galerias', location: 'Nivel 3', status: 'active', capacity: 74, today: 408, token: 'tk_1a6d3e7f8b96' },
  { id: 'ES-112', name: 'Sótano Mega Mall', zone: 'Mega Mall', location: 'Estacionamiento P1', status: 'active', capacity: 58, today: 195, token: 'tk_9f3d2e1a8c04' },
]

export const STATUS_CONFIG = {
  active: { label: 'Activa', color: '#34d399', ring: 'status-ring-active' },
  offline: { label: 'Desconectada', color: '#ef4444', ring: 'status-ring-offline' },
  warning: { label: 'Alerta', color: '#fbbf24', ring: 'status-ring-warning' },
}

export const ZONAS = ['UNITEC', 'Altara', 'Altia', 'City Mall', 'Mall Galerias', 'Mega Mall']

export const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export const DATA = {
  paper:   [310, 280, 340, 390, 420, 460, 510, 490, 430, 370, 300, 260],
  plastic: [190, 210, 230, 270, 310, 350, 380, 360, 290, 240, 200, 180],
  metal:   [140, 130, 155, 170, 185, 195, 210, 200, 180, 160, 135, 120],
}

export const SERIES = [
  { key: 'paper'   as const, color: '#a3e635', label: 'Papel' },
  { key: 'plastic' as const, color: '#22d3ee', label: 'Plástico' },
  { key: 'metal'   as const, color: '#a78bfa', label: 'Metal' },
]

export const MAX_VAL = 560
export const Y_TICKS = [0, 140, 280, 420, 560]

export const KPI_DATA = {
  kgTotal: 18432,
  kgSaved: 17104,
  co2: 5201,
  trees: 234,
  accuracy: 983,
  aiConf: 96,
  timeBetweenEmptying: 6.2,
  timeBetweenEmptyingPrev: 6.8,
  efficiencyGainPct: 8,
  frequency: "14 / sem",
  minZoneTime: "2.4h",
  maxZoneTime: "11.8h",
  totalEst: "247 est."
}

export const MATERIAL_CLASSIFIED_BREAKDOWN = [
  { name: 'Papel', count: 8520, pct: 46.2, color: '#a3e635' },
  { name: 'Plástico', count: 5860, pct: 31.8, color: '#22d3ee' },
  { name: 'Metal', count: 4052, pct: 22.0, color: '#a78bfa' },
]

export const IA_ACCURACY_BREAKDOWN = [
  { label: 'Papel', color: '#a3e635', val: 99.1 },
  { label: 'Plástico', color: '#22d3ee', val: 97.8 },
  { label: 'Metal', color: '#a78bfa', val: 98.2 },
]


