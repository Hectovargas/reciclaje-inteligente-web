import { useState, useEffect, useRef } from 'react'
import { APP_CONFIG } from '../config/app'
import { User } from '../types/user'

const MOCK_USERS: Record<string, User> = {
  'admin@recicla.com': {
    name: 'Admin Principal',
    email: 'admin@recicla.com',
    role: 'Super Administrador',
    accessLevel: 'Acceso Total del Sistema (Nivel 3)',
    initials: 'AP'
  },
  'admin@ecogrid.io': {
    name: 'Héctor Vargas',
    email: 'h.vargas@ecogrid.io',
    role: 'Super Administrador',
    accessLevel: 'Acceso Total del Sistema (Nivel 3)',
    initials: 'HV'
  },
  'operator@ecogrid.io': {
    name: 'Ana Martínez',
    email: 'operator@ecogrid.io',
    role: 'Operadora de Red',
    accessLevel: 'Acceso Básico (Nivel 1)',
    initials: 'AM'
  },
  'manager@ecogrid.io': {
    name: 'Carlos Ruiz',
    email: 'manager@ecogrid.io',
    role: 'Gerente de Zona',
    accessLevel: 'Acceso de Coordinación (Nivel 2)',
    initials: 'CR'
  }
}


type Phase = 'idle' | 'loading' | 'success'

/* ── Animated mesh-gradient canvas ── */
function MeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    let t = 0

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    // Orb config — slow drifting bioluminescent blobs
    const orbs = [
      { x: 0.15, y: 0.25, r: 0.45, color: [34, 211, 238],   speed: 0.00018, ox: 0.08, oy: 0.06 },
      { x: 0.80, y: 0.15, r: 0.40, color: [163, 230, 53],   speed: 0.00014, ox: 0.07, oy: 0.09 },
      { x: 0.50, y: 0.80, r: 0.50, color: [52, 211, 153],   speed: 0.00011, ox: 0.10, oy: 0.05 },
      { x: 0.85, y: 0.70, r: 0.30, color: [167, 139, 250],  speed: 0.00020, ox: 0.06, oy: 0.08 },
      { x: 0.20, y: 0.75, r: 0.35, color: [34, 211, 238],   speed: 0.00016, ox: 0.09, oy: 0.07 },
    ]

    const draw = (ts: number) => {
      t = ts
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      ctx.clearRect(0, 0, W, H)

      // Base
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, W, H)

      // Draw orbs
      orbs.forEach(orb => {
        const cx = (orb.x + Math.sin(t * orb.speed + orb.ox * 100) * orb.ox) * W
        const cy = (orb.y + Math.cos(t * orb.speed * 0.7 + orb.oy * 100) * orb.oy) * H
        const r = orb.r * Math.min(W, H)
        const [rr, g, b] = orb.color
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        grad.addColorStop(0, `rgba(${rr},${g},${b},0.14)`)
        grad.addColorStop(0.5, `rgba(${rr},${g},${b},0.05)`)
        grad.addColorStop(1, `rgba(${rr},${g},${b},0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.ellipse(cx, cy, r, r * 0.75, t * orb.speed * 0.3, 0, Math.PI * 2)
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  )
}

/* ── Grid overlay ── */
function GridOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: `
        linear-gradient(rgba(99,231,182,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99,231,182,0.04) 1px, transparent 1px)
      `,
      backgroundSize: '48px 48px',
    }} />
  )
}

/* ── Floating label input ── */
function FloatingInput({
  id, label, type = 'text', value, onChange, autoComplete,
}: {
  id: string; label: string; type?: string
  value: string; onChange: (v: string) => void; autoComplete?: string
}) {
  const [focused, setFocused] = useState(false)
  const raised = focused || value.length > 0

  return (
    <div style={{ position: 'relative', height: 58 }}>
      {/* Glow border container */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 12,
        transition: 'box-shadow 0.35s ease, border-color 0.35s ease',
        border: `1px solid ${focused ? 'rgba(34,211,238,0.5)' : 'rgba(99,231,182,0.14)'}`,
        boxShadow: focused
          ? '0 0 0 3px rgba(34,211,238,0.1), 0 0 20px rgba(34,211,238,0.12)'
          : 'none',
        background: focused ? 'rgba(34,211,238,0.04)' : 'rgba(22,32,50,0.55)',
        pointerEvents: 'none',
      }} />

      {/* Floating label */}
      <label
        htmlFor={id}
        style={{
          position: 'absolute', left: 16, pointerEvents: 'none',
          transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
          top: raised ? 8 : '50%',
          transform: raised ? 'none' : 'translateY(-50%)',
          fontSize: raised ? 10 : 13.5,
          fontWeight: raised ? 700 : 500,
          letterSpacing: raised ? '0.07em' : '0',
          textTransform: raised ? 'uppercase' : 'none',
          color: raised
            ? (focused ? '#22d3ee' : 'rgba(240,253,244,0.4)')
            : 'rgba(240,253,244,0.35)',
          zIndex: 1,
        }}
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          background: 'transparent', border: 'none', outline: 'none',
          padding: raised ? '24px 16px 8px' : '0 16px',
          color: '#f0fdf4', fontSize: 14, fontFamily: 'var(--font-sans)',
          fontWeight: 500, borderRadius: 12, zIndex: 0,
        }}
      />
    </div>
  )
}

/* ── Orbital scanner spinner ── */
function Scanner() {
  return (
    <svg width={22} height={22} viewBox="0 0 22 22" style={{ display: 'block' }}>
      <circle cx={11} cy={11} r={8} fill="none" stroke="rgba(13,17,23,0.35)" strokeWidth={2} />
      <circle
        cx={11} cy={11} r={8}
        fill="none"
        stroke="#0d1117"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray="12 38"
        style={{ transformOrigin: '11px 11px', animation: 'spin 0.9s linear infinite' }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}

/* ── Particle burst on success ── */
function SuccessBurst() {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2
    const dist = 60 + Math.random() * 40
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      color: i % 3 === 0 ? '#a3e635' : i % 3 === 1 ? '#22d3ee' : '#34d399',
      delay: i * 0.04,
    }
  })

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 20 }}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: '50%', top: '50%',
          width: 5, height: 5, borderRadius: '50%',
          background: p.color,
          boxShadow: `0 0 8px ${p.color}`,
          animation: `burst-${i} 0.7s cubic-bezier(0.25,0.46,0.45,0.94) ${p.delay}s forwards`,
        }} />
      ))}
      <style>{
        particles.map((p, i) =>
          `@keyframes burst-${i} {
            from { transform: translate(-50%,-50%) scale(1); opacity:1; }
            to { transform: translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px)) scale(0); opacity:0; }
          }`
        ).join('')
      }</style>
    </div>
  )
}

/* ── Main Login component ── */
export default function Login({ onAuth }: { onAuth: (user: User) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [showBurst, setShowBurst] = useState(false)
  const [cardExpanding, setCardExpanding] = useState(false)

  const [loginError, setLoginError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phase !== 'idle') return
    setPhase('loading')
    setLoginError('')

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Credenciales incorrectas')
      }

      const data = await res.json()
      // Store token so useApi hooks can use it without re-logging in
      sessionStorage.setItem('auth_token', data.access_token)

      const apiUser = data.user
      const emailLower = apiUser.email.toLowerCase()

      // Map backend role enum to display role
      const roleDisplay: Record<string, string> = {
        ADMIN: 'Super Administrador',
        MANAGER: 'Gerente de Zona',
        VIEWER: 'Operador de Red',
      }
      const accessLevelDisplay: Record<string, string> = {
        ADMIN: 'Acceso Total del Sistema (Nivel 3)',
        MANAGER: 'Acceso de Coordinación (Nivel 2)',
        VIEWER: 'Acceso Básico (Nivel 1)',
      }

      // Prefer pre-defined mock display data if email matches, else use API data
      let authenticatedUser = MOCK_USERS[emailLower] ?? {
        name: apiUser.name,
        email: apiUser.email,
        role: roleDisplay[apiUser.role] ?? apiUser.role,
        accessLevel: accessLevelDisplay[apiUser.role] ?? 'Acceso Básico (Nivel 1)',
        initials: apiUser.name
          .split(' ')
          .map((w: string) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || 'US',
      }

      setPhase('success')
      setShowBurst(true)
      setTimeout(() => {
        setCardExpanding(true)
        setTimeout(() => {
          onAuth(authenticatedUser)
        }, 650)
      }, 600)
    } catch (err: any) {
      setLoginError(err.message || 'Error de conexión con el servidor')
      setPhase('idle')
    }
  }


  const canSubmit = email.length > 0 && password.length > 0 && phase === 'idle'

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Dynamic background */}
      <MeshBackground />
      <GridOverlay />

      {/* Subtle vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(13,17,23,0.7) 100%)',
      }} />

      {/* Corner decorations */}
      <div style={{ position: 'absolute', top: 32, left: 40, opacity: 0.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #a3e635, #22d3ee)',
            boxShadow: '0 0 16px rgba(163,230,53,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d1117" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: '#f0fdf4' }}>
            {APP_CONFIG.logoText}<span style={{ color: '#a3e635' }}> {APP_CONFIG.logoSubtext}</span>
          </span>
        </div>
      </div>

      {/* Floating scan lines — top/bottom edge */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)',
        animation: 'scanH 4s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(163,230,53,0.3), transparent)',
        animation: 'scanH 4s ease-in-out infinite 2s',
      }} />

      <style>{`
        @keyframes scanH {
          0%,100% { opacity:0; transform: scaleX(0.2) translateX(-200%); }
          50% { opacity:1; transform: scaleX(1) translateX(0); }
        }
        @keyframes card-expand {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(8); opacity: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes logoFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes borderRotate {
          to { transform: rotate(360deg); }
        }
        @keyframes successPulse {
          0% { box-shadow: 0 0 0 0 rgba(52,211,153,0.5); }
          100% { box-shadow: 0 0 0 20px rgba(52,211,153,0); }
        }
      `}</style>

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: 420, maxWidth: 'calc(100vw - 48px)',
        animation: cardExpanding
          ? 'card-expand 0.65s cubic-bezier(0.4,0,1,1) forwards'
          : 'fadeInUp 0.6s cubic-bezier(0.4,0,0.2,1) forwards',
      }}>
        {/* Glow ring behind card */}
        <div style={{
          position: 'absolute', inset: -1,
          borderRadius: 22,
          backgroundImage: phase === 'success'
            ? 'linear-gradient(135deg, rgba(52,211,153,0.35), rgba(34,211,238,0.35))'
            : 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(163,230,53,0.25), rgba(34,211,238,0.25))',
          backgroundSize: '300% 300%',
          animation: 'holo-shift 4s ease infinite',
          filter: 'blur(8px)',
          transition: 'backgroundImage 0.5s',
        }} />

        {/* Glass card */}
        <div style={{
          position: 'relative',
          background: 'rgba(13,19,30,0.88)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: `1px solid ${phase === 'success' ? 'rgba(52,211,153,0.45)' : 'rgba(99,231,182,0.18)'}`,
          borderRadius: 20,
          padding: '32px 24px 28px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: phase === 'success'
            ? '0 0 60px rgba(52,211,153,0.2), 0 32px 80px rgba(0,0,0,0.6)'
            : '0 0 40px rgba(34,211,238,0.08), 0 32px 80px rgba(0,0,0,0.6)',
          transition: 'border-color 0.4s, box-shadow 0.4s',
        }}>
          {showBurst && <SuccessBurst />}

          {/* Inner top decoration — circuit-like dots */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: phase === 'success'
              ? 'linear-gradient(90deg, transparent, #34d399, transparent)'
              : 'linear-gradient(90deg, transparent, rgba(34,211,238,0.6), rgba(163,230,53,0.4), transparent)',
            transition: 'background 0.4s',
          }} />

          {/* Logo mark */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
              background: 'linear-gradient(135deg, rgba(163,230,53,0.15), rgba(34,211,238,0.15))',
              border: '1px solid rgba(99,231,182,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'logoFloat 3s ease-in-out infinite',
              boxShadow: '0 0 24px rgba(163,230,53,0.15)',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgba(163,230,53,0.6))' }}>
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </div>
            <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em', color: '#f0fdf4' }}>
              {APP_CONFIG.logoText}<span style={{ color: '#a3e635' }}> {APP_CONFIG.logoSubtext}</span>
            </div>
            <div style={{
              fontSize: 12, color: 'rgba(240,253,244,0.35)', marginTop: 4,
              fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
            }}>
              ACCESO AL SISTEMA
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ animation: 'fadeInUp 0.5s 0.1s both' }}>
              <FloatingInput
                id="email"
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
            </div>
            <div style={{ animation: 'fadeInUp 0.5s 0.2s both' }}>
              <FloatingInput
                id="password"
                label="Contraseña"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
            </div>

            {/* Remember */}
            <div style={{
              display: 'flex', alignItems: 'center',
              animation: 'fadeInUp 0.5s 0.3s both',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4,
                  border: '1px solid rgba(99,231,182,0.25)',
                  background: 'rgba(34,211,238,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: '#22d3ee', boxShadow: '0 0 6px rgba(34,211,238,0.6)' }} />
                </div>
                <span style={{ fontSize: 12, color: 'rgba(240,253,244,0.45)', fontWeight: 500 }}>Mantener sesión</span>
              </label>
            </div>

            {/* Error message */}
            {loginError && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171', fontSize: 12.5, fontWeight: 500,
                animation: 'fadeInUp 0.3s both',
              }}>
                ⚠ {loginError}
              </div>
            )}

            {/* Submit button */}
            <div style={{ animation: 'fadeInUp 0.5s 0.35s both', marginTop: 6 }}>
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  width: '100%', height: 52, borderRadius: 12, border: 'none',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700,
                  letterSpacing: '-0.01em',
                  position: 'relative', overflow: 'hidden',
                  background: phase === 'success'
                    ? 'linear-gradient(135deg, #34d399, #22d3ee)'
                    : canSubmit
                      ? 'linear-gradient(135deg, #a3e635, #22d3ee)'
                      : 'rgba(99,231,182,0.08)',
                  color: canSubmit ? '#0d1117' : 'rgba(240,253,244,0.25)',
                  boxShadow: phase === 'success'
                    ? '0 0 40px rgba(52,211,153,0.5)'
                    : canSubmit
                      ? '0 0 32px rgba(163,230,53,0.35), 0 4px 20px rgba(0,0,0,0.3)'
                      : 'none',
                  transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                  animation: phase === 'success' ? 'successPulse 0.4s ease-out' : 'none',
                }}
                onMouseEnter={e => canSubmit && (e.currentTarget.style.boxShadow = '0 0 48px rgba(163,230,53,0.55), 0 4px 24px rgba(0,0,0,0.4)')}
                onMouseLeave={e => canSubmit && (e.currentTarget.style.boxShadow = '0 0 32px rgba(163,230,53,0.35), 0 4px 20px rgba(0,0,0,0.3)')}
              >
                {/* Button shimmer on hover */}
                {canSubmit && phase === 'idle' && (
                  <div style={{
                    position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    animation: 'btn-shimmer 2.5s ease-in-out infinite',
                  }} />
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
                  {phase === 'idle' && <span>Acceder al sistema</span>}
                  {phase === 'loading' && (
                    <>
                      <Scanner />
                      <span style={{ fontSize: 13 }}>Verificando acceso...</span>
                    </>
                  )}
                  {phase === 'success' && (
                    <>
                      <span style={{ fontSize: 16, animation: 'check-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>✓</span>
                      <span>Acceso concedido</span>
                    </>
                  )}
                </div>

                <style>{`
                  @keyframes btn-shimmer {
                    0%,100% { left: -100%; }
                    50% { left: 140%; }
                  }
                `}</style>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
