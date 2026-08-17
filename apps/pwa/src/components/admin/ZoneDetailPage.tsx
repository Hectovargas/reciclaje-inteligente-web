'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Station, getStationFromZoneItem, useApi } from '@/config/api'
import { StationCard } from './StationCard'
import { StationDetailPage } from './StationDetailPage'

interface ZoneDetailPageProps {
  zoneId: string
}

export default function ZoneDetailPage({ zoneId }: ZoneDetailPageProps) {
  const router = useRouter()
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)

  const { data: metrics, loading } = useApi<any>('/dashboard/metrics')

  if (loading || !metrics) return <div style={{ color: 'white', padding: 20 }}>Cargando zona...</div>

  const ZONES = metrics.zonesData || []
  const zone = ZONES.find((z: any) => z.id === zoneId)
  if (!zone) return <div style={{ padding: 24, color: '#f0fdf4' }}>Zona no encontrada</div>

  if (selectedStation) {
    return <StationDetailPage station={selectedStation} onClose={() => setSelectedStation(null)} onRevoke={() => {}} />
  }

  const zc = zone.value > 85 ? '#a3e635' : zone.value > 65 ? '#22d3ee' : '#a78bfa'
  const activeCount = zone.stations.filter((s: any) => s.status === 'active').length
  const totalNetworkCount = ZONES.reduce((acc: number, z: any) => acc + (z.todayCount || 0), 0)
  const participationPct = totalNetworkCount > 0 && zone.todayCount ? Math.round((zone.todayCount / totalNetworkCount) * 100) : 0
  const todayCount = zone.todayCount || 0
  const prevCount = zone.prevCount || 1
  const diffCount = todayCount - prevCount
  const diffPct = Math.round((diffCount / prevCount) * 100)
  const diffColor = diffPct >= 0 ? '#34d399' : '#ef4444'
  const diffSign = diffPct >= 0 ? '+' : ''
  const fullStations: Station[] = zone.stations.map((s: any) => getStationFromZoneItem(s, zone.name))

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: '100%' }}>
      <div>
        <button onClick={() => router.push('/admin')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 99, marginBottom: 20, background: 'rgba(240,253,244,0.04)', border: '1px solid rgba(99,231,182,0.14)', color: 'rgba(240,253,244,0.55)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.2s' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver al dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: zc, boxShadow: `0 0 14px ${zc}` }} />
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: '#f0fdf4' }}>Zona {zone.name}</h1>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(240,253,244,0.38)' }}>{zone.stations.length} estaciones · {activeCount} activas · métricas en tiempo real</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', maxWidth: 420 }}>
            {[
              { label: 'Volumen hoy', value: todayCount.toLocaleString(), color: zc, subtext: `${diffSign}${diffPct}% vs ayer`, subtextColor: diffColor },
              { label: 'Participación red', value: `${participationPct}%`, color: '#22d3ee', subtext: 'del total', subtextColor: 'rgba(240,253,244,0.35)' },
              { label: 'Estaciones activas', value: `${activeCount}/${zone.stations.length}`, color: '#a78bfa', subtext: 'operativas', subtextColor: 'rgba(240,253,244,0.35)' },
            ].map(p => (
              <div key={p.label} style={{ padding: '10px 18px', borderRadius: 12, background: `${p.color}0f`, border: `1px solid ${p.color}28`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 800, color: p.color }}>{p.value}</span>
                <span style={{ fontSize: 9.5, color: 'rgba(240,253,244,0.45)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{p.label}</span>
                <span style={{ fontSize: 8.5, color: p.subtextColor, fontWeight: 500, marginTop: 2 }}>{p.subtext}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
        {fullStations.map(st => (
          <StationCard key={st.id} station={st} onClick={() => setSelectedStation(st)} />
        ))}
      </div>
    </div>
  )
}
