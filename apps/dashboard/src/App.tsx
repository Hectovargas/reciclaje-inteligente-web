import { useState } from 'react'
import Dashboard from './components/Dashboard'
import Stations from './components/Stations'
import Login from './components/Login'
import { APP_CONFIG } from './config/app'
import './index.css'

const TABS = [
  { id: 'dashboard', label: 'Control de Misión' },
  { id: 'stations', label: 'Estaciones' },
]

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  if (!authed) return <Login onAuth={() => setAuthed(true)} />

  return (
    <div className="mesh-bg min-h-screen">
      {/* Sidebar */}
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside style={{
          width: 220,
          minHeight: '100vh',
          background: 'rgba(13,17,23,0.85)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(99,231,182,0.1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 16px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 40, paddingLeft: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #a3e635, #22d3ee)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px rgba(163,230,53,0.4)',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d1117" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: '#f0fdf4' }}>
                {APP_CONFIG.logoText}<span style={{ color: '#a3e635' }}> {APP_CONFIG.logoSubtext}</span>
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13.5,
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? '#a3e635' : 'rgba(240,253,244,0.5)',
                  background: activeTab === tab.id
                    ? 'rgba(163,230,53,0.1)'
                    : 'transparent',
                  boxShadow: activeTab === tab.id
                    ? 'inset 0 0 0 1px rgba(163,230,53,0.2)'
                    : 'none',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  letterSpacing: '-0.01em',
                }}
              >
                <span style={{ fontSize: 15 }}>
                  {tab.id === 'dashboard' ? '⬡' : '◎'}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* User profile footer */}
          <div style={{ position: 'relative', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(99,231,182,0.1)' }}>
            {showUserMenu && (
              <div style={{
                position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 10,
                background: 'rgba(15,22,36,0.95)', backdropFilter: 'blur(25px)',
                borderRadius: 12, border: '1px solid rgba(99,231,182,0.16)',
                padding: '6px', display: 'flex', flexDirection: 'column', gap: 2,
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 10
              }}>
                <button
                  onClick={() => { setShowProfileModal(true); setShowUserMenu(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent',
                    color: '#f0fdf4', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'var(--font-sans)', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(240,253,244,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Mi Perfil
                </button>
                <button
                  onClick={() => { setAuthed(false); setShowUserMenu(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent',
                    color: '#ef4444', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'var(--font-sans)', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            )}

            <div
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 12,
                cursor: 'pointer', transition: 'background 0.2s', background: showUserMenu ? 'rgba(240,253,244,0.05)' : 'transparent'
              }}
              onMouseEnter={e => { if (!showUserMenu) e.currentTarget.style.background = 'rgba(240,253,244,0.03)' }}
              onMouseLeave={e => { if (!showUserMenu) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #a3e635, #22d3ee)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#0d1117',
                fontSize: 12, boxShadow: '0 0 12px rgba(163,230,53,0.3)'
              }}>
                HV
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#f0fdf4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Héctor Vargas</div>
                <div style={{ fontSize: 9.5, color: '#a3e635', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Administrador</div>
              </div>
              <span style={{ fontSize: 10, color: 'rgba(240,253,244,0.3)' }}>{showUserMenu ? '▲' : '▼'}</span>
            </div>
          </div>

        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'stations' && <Stations />}
        </main>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(11,16,26,0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="glass-card" style={{
            width: 400, padding: 28, position: 'relative', display: 'flex', flexDirection: 'column', gap: 20,
            border: '1px solid rgba(99,231,182,0.18)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Mi Perfil de Usuario
              </span>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{
                  border: 'none', background: 'transparent', color: 'rgba(240,253,244,0.5)',
                  fontSize: 16, cursor: 'pointer', padding: 4
                }}
              >✕</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #a3e635, #22d3ee)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#0d1117',
                fontSize: 22, boxShadow: '0 0 20px rgba(163,230,53,0.4)'
              }}>
                HV
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f0fdf4' }}>Héctor Vargas</h2>
                <div style={{ fontSize: 11, color: '#a3e635', fontWeight: 700, marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Super Administrador
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14, borderRadius: 12, background: 'rgba(11,16,26,0.4)', border: '1px solid rgba(99,231,182,0.08)' }}>
              <div>
                <div style={{ fontSize: 9, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Correo Electrónico</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#f0fdf4', marginTop: 2 }}>h.vargas@ecogrid.io</div>
              </div>
              <div style={{ height: 1, background: 'rgba(99,231,182,0.06)' }} />
              <div>
                <div style={{ fontSize: 9, color: 'rgba(240,253,244,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Nivel de Acceso</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#22d3ee', marginTop: 2 }}>Acceso Total del Sistema (Nivel 3)</div>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              style={{
                width: '100%', padding: '11px 0', border: '1px solid rgba(99,231,182,0.3)',
                borderRadius: 10, background: 'rgba(99,231,182,0.06)', color: '#a3e635',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(99,231,182,0.14)'
                e.currentTarget.style.boxShadow = '0 0 16px rgba(163,230,53,0.2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(99,231,182,0.06)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
