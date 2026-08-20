'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Cpu,
  Layers,
  Sparkles,
  Smartphone,
  ChevronRight,
} from 'lucide-react'

export function AdminSidebar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/estaciones', label: 'Estaciones', icon: Cpu },
    { href: '/admin/zonas-admin', label: 'Zonas', icon: Layers },
    { href: '/admin/ia-details', label: 'IA & Feed', icon: Sparkles },
  ]

  return (
    <aside
      className="desktop-only"
      style={{
        width: 230,
        flexShrink: 0,
        borderRight: '1px solid rgba(99,231,182,0.12)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        position: 'sticky',
        top: 0,
        height: '100vh',
        background: 'rgba(13, 17, 23, 0.75)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Brand Header */}
      <div style={{ marginBottom: 28, paddingLeft: 6 }}>
        <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em', color: '#f0fdf4' }}>
          EcoGrid<span style={{ color: '#a3e635' }}>AI</span>
        </div>
        <div
          style={{
            fontSize: 9.5,
            color: 'rgba(240,253,244,0.45)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            marginTop: 3,
            textTransform: 'uppercase',
          }}
        >
          CleanCity Admin
        </div>
      </div>

      {/* Main Admin Navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            fontSize: 9.5,
            color: 'rgba(240,253,244,0.35)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            paddingLeft: 8,
            marginBottom: 2,
          }}
        >
          Administración
        </div>
        {navItems.map(item => {
          const Icon = item.icon
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Citizen View Action */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 16,
          borderTop: '1px solid rgba(99,231,182,0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div
          style={{
            fontSize: 9.5,
            color: 'rgba(240,253,244,0.35)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            paddingLeft: 8,
            marginBottom: 2,
          }}
        >
          Modo Aplicación
        </div>
        <Link
          href="/app"
          className="nav-link-item citizen-switch-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 700,
          }}
          title="Ir a la Vista Ciudadano (PWA)"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Smartphone size={16} color="#22d3ee" />
            <span style={{ fontSize: '12.5px' }}>Vista Ciudadano</span>
          </div>
          <ChevronRight size={15} color="rgba(34, 211, 238, 0.8)" />
        </Link>
      </div>
    </aside>
  )
}

export function AdminMobileHeader() {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin', label: '◈', title: 'Dashboard' },
    { href: '/admin/estaciones', label: '⬡', title: 'Estaciones' },
    { href: '/admin/zonas-admin', label: '⬢', title: 'Zonas' },
    { href: '/admin/ia-details', label: '◉', title: 'IA & Feed' },
  ]

  return (
    <header className="mobile-header">
      <div style={{ fontSize: 16, fontWeight: 800, color: '#f0fdf4' }}>
        EcoGrid<span style={{ color: '#a3e635' }}>AI</span>
      </div>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {navItems.map(item => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.title}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                color: isActive ? '#a3e635' : 'rgba(240,253,244,0.7)',
                background: isActive ? 'rgba(163, 230, 53, 0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(163, 230, 53, 0.25)' : '1px solid transparent',
                fontSize: 16,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {item.label}
            </Link>
          )
        })}
        <Link
          href="/app"
          title="Ir a Vista Ciudadano"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(163, 230, 53, 0.08))',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            color: '#22d3ee',
            fontSize: '11px',
            fontWeight: 700,
            textDecoration: 'none',
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.2s ease',
          }}
        >
          <Smartphone size={13} />
          <span>Ciudadano</span>
        </Link>
      </nav>
    </header>
  )
}
