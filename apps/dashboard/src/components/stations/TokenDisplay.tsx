import { useState } from 'react'

export function TokenDisplay({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(token).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
      <div style={{
        flex: 1, fontFamily: 'var(--font-mono)', fontSize: 11,
        padding: '6px 10px', borderRadius: 6,
        background: 'rgba(34,211,238,0.07)',
        border: '1px solid rgba(34,211,238,0.2)',
        color: '#22d3ee', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {token}
      </div>
      <button
        onClick={copy}
        style={{
          width: 32, height: 32, borderRadius: 6, border: 'none',
          background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(34,211,238,0.1)',
          color: copied ? '#34d399' : '#22d3ee',
          cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s',
          boxShadow: copied ? '0 0 12px rgba(52,211,153,0.3)' : 'none',
        }}
        title="Copiar token"
      >
        <span className={copied ? 'check-pop' : ''} style={{ display: 'inline-block' }}>
          {copied ? '✓' : '⧉'}
        </span>
      </button>
    </div>
  )
}
