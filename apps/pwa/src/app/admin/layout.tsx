import type { Metadata } from 'next'
import Link from 'next/link'
import './admin.css'

export const metadata: Metadata = {
  title: 'EcoGridAI Admin — CleanCity',
  description: 'Panel administrativo de la red de reciclaje inteligente CleanCity',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-wrapper mesh-bg" style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
        <AdminMobileHeader />
        {children}
      </main>
    </div>
  )
}

function AdminSidebar() {
  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '◈' },
    { href: '/admin/estaciones', label: 'Estaciones', icon: '⬡' },
    { href: '/admin/zonas-admin', label: 'Zonas', icon: '⬢' },
    { href: '/admin/ia-details', label: 'IA & Feed', icon: '◉' },
  ]
  return (
    <aside className="desktop-only" style={{ width: 220, flexShrink: 0, borderRight: '1px solid rgba(99,231,182,0.12)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8, position: 'sticky', top: 0, height: '100vh' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: '#f0fdf4' }}>EcoGrid<span style={{ color: '#a3e635' }}>AI</span></div>
        <div style={{ fontSize: 10, color: 'rgba(240,253,244,0.4)', fontWeight: 600, letterSpacing: '0.06em', marginTop: 2 }}>CLEANCITY ADMIN</div>
      </div>
      {navItems.map(item => (
        <Link key={item.href} href={item.href} className="nav-link-item">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16 }}>{item.icon}</span>
          {item.label}
        </Link>
      ))}
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(99,231,182,0.1)' }}>
        <Link href="/app" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(240,253,244,0.4)', textDecoration: 'none', fontFamily: 'var(--font-sans)' }}>
          ← Vista Ciudadano
        </Link>
      </div>
    </aside>
  )
}

function AdminMobileHeader() {
  return (
    <header className="mobile-header">
      <div style={{ fontSize: 16, fontWeight: 800, color: '#f0fdf4' }}>EcoGrid<span style={{ color: '#a3e635' }}>AI</span></div>
      <nav style={{ display: 'flex', gap: 4 }}>
        {[
          { href: '/admin', label: '◈' },
          { href: '/admin/estaciones', label: '⬡' },
          { href: '/admin/zonas-admin', label: '⬢' },
          { href: '/admin/ia-details', label: '◉' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{ padding: '8px 12px', borderRadius: 8, color: 'rgba(240,253,244,0.7)', fontSize: 18, textDecoration: 'none' }}>{item.label}</Link>
        ))}
      </nav>
    </header>
  )
}
