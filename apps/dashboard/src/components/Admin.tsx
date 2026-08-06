import { useState } from 'react'
import { USERS, ROLE_CONFIG, Role } from '../mocks/data'
import { AvatarCircle } from './admin/AvatarCircle'

export default function Admin() {
  const [users] = useState(USERS)
  const [search, setSearch] = useState('')

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '32px 28px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', margin: 0, color: '#f0fdf4' }}>
          Panel de Administrador
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(240,253,244,0.4)' }}>
          Control de acceso y vinculación de estaciones
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* User table */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f0fdf4' }}>Usuarios del sistema</span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 14px', borderRadius: 8,
              background: 'rgba(22,32,50,0.6)',
              border: '1px solid rgba(99,231,182,0.12)',
            }}>
              <span style={{ fontSize: 12, color: 'rgba(240,253,244,0.3)' }}>⌕</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar usuario..."
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  color: '#f0fdf4', fontSize: 12, fontFamily: 'var(--font-sans)',
                  width: 150,
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.5fr 100px 80px 100px',
              padding: '0 8px 10px',
              borderBottom: '1px solid rgba(99,231,182,0.08)',
            }}>
              {['Usuario', 'Email', 'Rol', 'Estaciones', 'Última actividad'].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(240,253,244,0.35)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  {h}
                </span>
              ))}
            </div>

            {filtered.map((user, i) => {
              const rc = ROLE_CONFIG[user.role]
              return (
                <div
                  key={user.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 100px 80px 100px',
                    alignItems: 'center',
                    padding: '12px 8px',
                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(99,231,182,0.05)' : 'none',
                    borderRadius: 8,
                    transition: 'background 0.15s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,231,182,0.04)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AvatarCircle initials={user.avatar} color={rc.color} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f0fdf4' }}>{user.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(240,253,244,0.4)', fontFamily: 'var(--font-mono)' }}>
                    {user.email}
                  </span>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '3px 10px', borderRadius: 99,
                    background: rc.bg,
                    fontSize: 11, fontWeight: 700, color: rc.color,
                    width: 'fit-content',
                  }}>
                    {user.role}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#22d3ee', fontFamily: 'var(--font-mono)', textShadow: '0 0 12px rgba(34,211,238,0.4)' }}>
                    {user.stations}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(240,253,244,0.35)', fontFamily: 'var(--font-mono)' }}>
                    {user.lastActive}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pending stations */}
        <div>
          {/* Quick stats */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(240,253,244,0.45)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>
              Resumen de roles
            </div>
            {(['Admin', 'Operador', 'Usuario'] as Role[]).map(role => {
              const count = users.filter(u => u.role === role).length
              const rc = ROLE_CONFIG[role]
              const pct = (count / users.length) * 100
              return (
                <div key={role} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'rgba(240,253,244,0.6)', fontWeight: 600 }}>{role}</span>
                    <span style={{ fontSize: 12, color: rc.color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{count}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(240,253,244,0.06)' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${pct}%`, background: rc.color,
                      boxShadow: `0 0 8px ${rc.color}50`,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
