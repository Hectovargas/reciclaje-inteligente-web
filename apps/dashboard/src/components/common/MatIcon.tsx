export function MatIcon({ m, color }: { m: string; color: string }) {
  const s = { width: 15, height: 15, fill: 'none' as const, stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (m === 'paper') return (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>
    </svg>
  )
  if (m === 'plastic') return (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M9 2h6l2 4H7L9 2z"/><path d="M7 6v14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6"/><line x1="10" y1="11" x2="14" y2="11"/>
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" {...s}>
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  )
}
