'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Cpu,
  Layers,
  Sparkles,
  Smartphone,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/estaciones', label: 'Estaciones', icon: Cpu },
  { href: '/admin/zonas-admin', label: 'Zonas', icon: Layers },
  { href: '/admin/ia-details', label: 'IA & Feed', icon: Sparkles },
]

export function AdminSidebar() {
  const pathname = usePathname()

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
  const [isOpen, setIsOpen] = useState(false)

  // Auto-close mobile drawer when the route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Handle escape key and prevent body scroll when drawer is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <>
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Abrir menú de navegación"
            aria-expanded={isOpen}
            className="menu-toggle-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(163, 230, 53, 0.08)',
              border: '1px solid rgba(163, 230, 53, 0.25)',
              color: '#a3e635',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.2s ease',
            }}
          >
            <Menu size={20} />
          </button>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: '#f0fdf4', lineHeight: 1.2 }}>
              EcoGrid<span style={{ color: '#a3e635' }}>AI</span>
            </div>
            <div
              style={{
                fontSize: 9,
                color: 'rgba(240,253,244,0.4)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              CleanCity Admin
            </div>
          </div>
        </div>

        <Link
          href="/app"
          title="Ir a Vista Ciudadano"
          className="citizen-switch-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 8,
            fontSize: '12px',
            fontWeight: 700,
            textDecoration: 'none',
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.2s ease',
          }}
        >
          <Smartphone size={14} color="#22d3ee" />
          <span>Ciudadano</span>
        </Link>
      </header>

      {/* Backdrop overlay */}
      <div
        className={`mobile-drawer-overlay ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Mobile Sidebar / Drawer */}
      <aside
        className={`mobile-drawer ${isOpen ? 'open' : ''}`}
        aria-label="Navegación móvil"
      >
        {/* Drawer Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: '1px solid rgba(99,231,182,0.12)',
          }}
        >
          <div style={{ paddingLeft: 4 }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', color: '#f0fdf4' }}>
              EcoGrid<span style={{ color: '#a3e635' }}>AI</span>
            </div>
            <div
              style={{
                fontSize: 9.5,
                color: 'rgba(240,253,244,0.45)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                marginTop: 2,
                textTransform: 'uppercase',
              }}
            >
              CleanCity Admin
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menú"
            className="drawer-close-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(240, 253, 244, 0.06)',
              border: '1px solid rgba(240, 253, 244, 0.12)',
              color: 'rgba(240, 253, 244, 0.8)',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.2s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div
            style={{
              fontSize: 9.5,
              color: 'rgba(240,253,244,0.35)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              paddingLeft: 8,
              marginBottom: 4,
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
                onClick={() => setIsOpen(false)}
                className={`nav-link-item ${isActive ? 'active' : ''}`}
                style={{
                  fontSize: '14px',
                  padding: '12px 14px',
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Bottom Switch to Citizen */}
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
            onClick={() => setIsOpen(false)}
            className="nav-link-item citizen-switch-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 700,
            }}
            title="Ir a la Vista Ciudadano (PWA)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Smartphone size={18} color="#22d3ee" />
              <span style={{ fontSize: '13px' }}>Vista Ciudadano</span>
            </div>
            <ChevronRight size={16} color="rgba(34, 211, 238, 0.8)" />
          </Link>
        </div>
      </aside>
    </>
  )
}
