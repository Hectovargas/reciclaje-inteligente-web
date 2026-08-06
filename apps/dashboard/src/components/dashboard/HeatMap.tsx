import { ZONES } from '../../mocks/data'

export function HeatMap({ onZoneClick }: { onZoneClick: (z: typeof ZONES[0]) => void }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
        {ZONES.map(z => {
          const intensity = z.value > 85 ? { bg: 'rgba(163,230,53,0.18)', border: 'rgba(163,230,53,0.45)', text: '#a3e635' }
            : z.value > 65 ? { bg: 'rgba(34,211,238,0.14)', border: 'rgba(34,211,238,0.38)', text: '#22d3ee' }
            : z.value > 45 ? { bg: 'rgba(34,211,238,0.09)', border: 'rgba(34,211,238,0.22)', text: '#22d3ee' }
            : { bg: 'rgba(167,139,250,0.09)', border: 'rgba(167,139,250,0.22)', text: '#a78bfa' }
          return (
            <button
              key={z.id}
              onClick={() => onZoneClick(z)}
              style={{
                padding: '14px 8px', borderRadius: 10, border: `1px solid ${intensity.border}`,
                background: intensity.bg, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                boxShadow: `0 0 12px ${intensity.border}30`,
                transition: 'all 0.22s cubic-bezier(.4,0,.2,1)', fontFamily: 'var(--font-sans)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 0 24px ${intensity.border}55` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 0 12px ${intensity.border}30` }}
            >
              <span style={{ fontSize: 16, fontWeight: 800, color: intensity.text, textShadow: `0 0 14px ${intensity.text}70`, letterSpacing: '-0.02em' }}>{z.value}%</span>
              <span style={{ fontSize: 9.5, color: 'rgba(240,253,244,0.45)', fontWeight: 600 }}>{z.name}</span>
              <span style={{ fontSize: 8.5, color: 'rgba(240,253,244,0.22)', fontFamily: 'var(--font-mono)' }}>{z.stations.length} est.</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
