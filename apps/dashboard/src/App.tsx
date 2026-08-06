import { useState } from 'react'
import Dashboard from './components/Dashboard'
import Stations from './components/Stations'
import Login from './components/Login'
import './index.css'

const TABS = [
  { id: 'dashboard', label: 'Control de Misión' },
  { id: 'stations', label: 'Estaciones' },
]

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

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
                fontSize: 16,
              }}>♻</div>
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', color: '#f0fdf4' }}>
                EcoGrid<span style={{ color: '#a3e635' }}>AI</span>
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
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

        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'stations' && <Stations />}
        </main>
      </div>
    </div>
  )
}
