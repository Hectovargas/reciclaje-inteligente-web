export function AvatarCircle({ initials, color }: { initials: string; color: string }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%',
      background: `${color}20`,
      border: `1px solid ${color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color,
      flexShrink: 0,
      boxShadow: `0 0 12px ${color}20`,
    }}>
      {initials}
    </div>
  )
}
