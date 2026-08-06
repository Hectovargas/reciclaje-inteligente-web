import { useState } from 'react'
import { ZONES } from '../mocks/data'
import { DatePicker } from './common/DatePicker'
import { DashboardMetrics } from './dashboard/DashboardMetrics'
import { LiveFeed } from './dashboard/LiveFeed'
import { HeatMap } from './dashboard/HeatMap'
import { PeakHoursChart } from './dashboard/PeakHoursChart'
import { ZoneDetailPage } from './dashboard/ZoneDetailPage'

export default function Dashboard() {
  const [selectedZone, setSelectedZone] = useState<typeof ZONES[0] | null>(null)

  if (selectedZone) {
    return <ZoneDetailPage zone={selectedZone} onClose={() => setSelectedZone(null)} />
  }

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ─ Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', margin: 0, color: '#f0fdf4' }}>Centro de Control</h1>
          <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'rgba(240,253,244,0.38)' }}>Red de reciclaje inteligente · Tiempo real</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 99,
            background: 'rgba(163,230,53,0.07)', border: '1px solid rgba(163,230,53,0.22)',
          }}>
            <div className="pulse-dot" style={{ width: 7, height: 7 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#a3e635' }}>247 Estaciones Activas</span>
          </div>
          <DatePicker />
        </div>
      </div>

      {/* ─ KPIs 2×2 + Feed ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'stretch', isolation: 'isolate' }}>
        <DashboardMetrics />
        <LiveFeed />
      </div>

      {/* ─ Row 3: Heatmap full width ──────────────────────────────── */}
      <div className="glass-card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(240,253,244,0.42)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Mapa de calor por zonas
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(240,253,244,0.55)' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            Clic en zona para desglose
          </div>
        </div>
        <HeatMap onZoneClick={setSelectedZone} />
      </div>

      {/* ─ Row 4: Peak hours ──────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: 22, overflow: 'hidden', isolation: 'isolate' }}>
        <PeakHoursChart />
      </div>

    </div>
  )
}
