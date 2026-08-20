import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decodeJwt } from 'jose'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token =
    request.cookies.get('access_token')?.value ||
    request.cookies.get('auth_token')?.value

  // Helper: build redirect URL
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  let payload: { role?: string; sub?: string; exp?: number } | null = null
  let isExpired = false
  if (token) {
    try {
      const decoded = decodeJwt(token) as { role?: string; sub?: string; exp?: number }
      if (decoded && typeof decoded.exp === 'number' && decoded.exp * 1000 <= Date.now()) {
        isExpired = true
        payload = null
      } else if (decoded && decoded.role) {
        payload = decoded
      }
    } catch {
      payload = null
    }
  }

  // If already logged in and visiting /login or /register, redirect to destination
  if ((pathname === '/login' || pathname === '/register') && payload) {
    if (payload.role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url))
    return NextResponse.redirect(new URL('/app', request.url))
  }

  // Protect /admin/** — only ADMIN role
  if (pathname.startsWith('/admin')) {
    if (!payload) {
      const res = redirectTo('/login')
      if (isExpired) {
        res.cookies.delete('access_token')
        res.cookies.delete('auth_token')
      }
      return res
    }
    if (payload.role !== 'ADMIN') return redirectTo('/app')
    return NextResponse.next()
  }

  // Protect /app/** — any authenticated user
  if (pathname.startsWith('/app')) {
    if (!payload) {
      const res = redirectTo('/login')
      if (isExpired) {
        res.cookies.delete('access_token')
        res.cookies.delete('auth_token')
      }
      return res
    }
    return NextResponse.next()
  }

  // Root redirect based on role
  if (pathname === '/') {
    if (!payload) {
      const res = NextResponse.redirect(new URL('/login', request.url))
      if (isExpired) {
        res.cookies.delete('access_token')
        res.cookies.delete('auth_token')
      }
      return res
    }
    if (payload.role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url))
    return NextResponse.redirect(new URL('/app', request.url))
  }

  const response = NextResponse.next()
  if (isExpired) {
    response.cookies.delete('access_token')
    response.cookies.delete('auth_token')
  }
  return response
}

export const config = {
  matcher: ['/', '/login', '/register', '/admin/:path*', '/app/:path*'],
}
