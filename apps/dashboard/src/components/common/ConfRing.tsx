export function ConfRing({ value }: { value: number }) {
  const R = 38, C = 2 * Math.PI * R
  return (
    <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
      <svg width={96} height={96} viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a3e635"/><stop offset="100%" stopColor="#22d3ee"/>
          </linearGradient>
          <filter id="rg2">
            <feGaussianBlur stdDeviation="2.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx={48} cy={48} r={R} fill="none" stroke="rgba(240,253,244,0.06)" strokeWidth={9}/>
        <circle cx={48} cy={48} r={R} fill="none" stroke="url(#rg)" strokeWidth={9}
          strokeLinecap="round" strokeDasharray={C}
          strokeDashoffset={C - (value / 100) * C}
          filter="url(#rg2)"
          style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#a3e635', lineHeight: 1, textShadow: '0 0 14px rgba(163,230,53,0.5)' }}>{value}%</div>
        <div style={{ fontSize: 8, color: 'rgba(240,253,244,0.5)', marginTop: 2, letterSpacing: '0.05em' }}>CONF.</div>
      </div>
    </div>
  )
}
