export type Station = {
  id: string
  name: string
  location: string
  status: 'active' | 'offline' | 'warning'
  capacity: number
  today: number
  token: string
  hardware: { cpu: number; temp: number; uptime: string }
}

export type Role = 'Admin' | 'Operador' | 'Usuario'

export type User = {
  id: number
  name: string
  email: string
  role: Role
  stations: number
  lastActive: string
  avatar: string
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
    id: 'centro', name: 'Centro', value: 94,
    stations: [
      { id: 'ES-042', name: 'Parque Central',    fill: 94, status: 'active',  last: 'Papel' },
      { id: 'ES-018', name: 'Metro Alameda',     fill: 78, status: 'active',  last: 'Plástico' },
      { id: 'ES-055', name: 'Plaza Mayor',       fill: 61, status: 'active',  last: 'Metal' },
    ],
  },
  {
    id: 'norte', name: 'Norte', value: 78,
    stations: [
      { id: 'ES-011', name: 'Av. Reforma Norte', fill: 78, status: 'active',  last: 'Papel' },
      { id: 'ES-022', name: 'Parque Industria',  fill: 52, status: 'active',  last: 'Metal' },
    ],
  },
  {
    id: 'sur', name: 'Sur', value: 61,
    stations: [
      { id: 'ES-033', name: 'Mercado Sur',       fill: 61, status: 'active',  last: 'Plástico' },
      { id: 'ES-044', name: 'Terminal Bus',      fill: 39, status: 'active',  last: 'Papel' },
    ],
  },
  {
    id: 'este', name: 'Este', value: 85,
    stations: [
      { id: 'ES-077', name: 'Campus Univ.',      fill: 85, status: 'active',  last: 'Plástico' },
      { id: 'ES-088', name: 'Tecnológico',       fill: 71, status: 'warning', last: 'Metal' },
    ],
  },
  {
    id: 'oeste', name: 'Oeste', value: 43,
    stations: [
      { id: 'ES-099', name: 'Centro Cívico',     fill: 43, status: 'active',  last: 'Papel' },
      { id: 'ES-101', name: 'Av. Libertad',      fill: 12, status: 'offline', last: '—' },
    ],
  },
  {
    id: 'peri', name: 'Periferia', value: 29,
    stations: [
      { id: 'ES-112', name: 'Zona Industrial',   fill: 29, status: 'active',  last: 'Metal' },
    ],
  },
]

export const TOP3 = [
  { id: 'ES-042', name: 'Parque Central', fill: 94 },
  { id: 'ES-077', name: 'Campus Univ.',   fill: 85 },
  { id: 'ES-011', name: 'Av. Reforma N.', fill: 78 },
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
  { id: 'ES-042', name: 'Parque Central', location: 'Av. Libertad 1240', status: 'active', capacity: 87, today: 234, token: 'tk_a9f2bc41e7d3', hardware: { cpu: 23, temp: 41, uptime: '14d 6h' } },
  { id: 'ES-018', name: 'Metro Alameda', location: 'Estación Metro L2', status: 'active', capacity: 62, today: 189, token: 'tk_e3b1c90d4f82', hardware: { cpu: 31, temp: 38, uptime: '7d 2h' } },
  { id: 'ES-091', name: 'Mercado Sur', location: 'Calle Marte 88', status: 'warning', capacity: 95, today: 312, token: 'tk_77d4a12fe6c3', hardware: { cpu: 78, temp: 67, uptime: '1d 4h' } },
  { id: 'ES-055', name: 'Campus Universitario', location: 'Blvd. Educación 500', status: 'active', capacity: 41, today: 156, token: 'tk_c2f9e05b3a74', hardware: { cpu: 18, temp: 36, uptime: '30d 12h' } },
  { id: 'ES-007', name: 'Plaza Norte', location: 'Centro Comercial N1', status: 'offline', capacity: 0, today: 0, token: 'tk_5e8b2d1f9c05', hardware: { cpu: 0, temp: 0, uptime: '—' } },
  { id: 'ES-033', name: 'Aeropuerto T2', location: 'Terminal 2, Nivel P', status: 'active', capacity: 74, today: 408, token: 'tk_1a6d3e7f8b96', hardware: { cpu: 42, temp: 44, uptime: '21d 8h' } },
]

export const STATUS_CONFIG = {
  active: { label: 'Activa', color: '#34d399', ring: 'status-ring-active' },
  offline: { label: 'Desconectada', color: '#ef4444', ring: 'status-ring-offline' },
  warning: { label: 'Alerta', color: '#fbbf24', ring: 'status-ring-warning' },
}

export const ZONAS = ['Centro', 'Norte', 'Sur', 'Este', 'Oeste', 'Periferia']

export const USERS: User[] = [
  { id: 1, name: 'Valentina Cruz', email: 'v.cruz@ecogrid.io', role: 'Admin', stations: 47, lastActive: 'Ahora mismo', avatar: 'VC' },
  { id: 2, name: 'Mateo Rodríguez', email: 'm.rodriguez@ecogrid.io', role: 'Operador', stations: 23, lastActive: 'hace 12 min', avatar: 'MR' },
  { id: 3, name: 'Sofía Herrera', email: 's.herrera@ecogrid.io', role: 'Operador', stations: 18, lastActive: 'hace 1h', avatar: 'SH' },
  { id: 4, name: 'Diego Morales', email: 'd.morales@ecogrid.io', role: 'Usuario', stations: 5, lastActive: 'hace 2h', avatar: 'DM' },
  { id: 5, name: 'Camila Vargas', email: 'c.vargas@ecogrid.io', role: 'Admin', stations: 89, lastActive: 'hace 4h', avatar: 'CV' },
  { id: 6, name: 'Andrés Jiménez', email: 'a.jimenez@ecogrid.io', role: 'Usuario', stations: 2, lastActive: 'hace 1d', avatar: 'AJ' },
]

export const PENDING_STATIONS = [
  { id: 'ES-NEW-001', location: 'Centro Logístico Norte', initiated: 'hace 3 min', ready: false },
  { id: 'ES-NEW-002', location: 'Parque Industrial Sur', initiated: 'hace 18 min', ready: true },
  { id: 'ES-NEW-003', location: 'Mall Tecnológico', initiated: 'hace 42 min', ready: false },
]

export const ROLE_CONFIG: Record<Role, { color: string; bg: string }> = {
  Admin: { color: '#a3e635', bg: 'rgba(163,230,53,0.12)' },
  Operador: { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
  Usuario: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
}

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


