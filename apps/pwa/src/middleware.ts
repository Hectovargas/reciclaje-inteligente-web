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

  let payload: { role?: string; sub?: string } | null = null
  if (token) {
    try {
      payload = decodeJwt(token) as { role?: string; sub?: string }
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
    if (!payload) return redirectTo('/login')
    if (payload.role !== 'ADMIN') return redirectTo('/app')
    return NextResponse.next()
  }

  // Protect /app/** — any authenticated user
  if (pathname.startsWith('/app')) {
    if (!payload) return redirectTo('/login')
    return NextResponse.next()
  }

  // Root redirect based on role
  if (pathname === '/') {
    if (!payload) return NextResponse.redirect(new URL('/login', request.url))
    if (payload.role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url))
    return NextResponse.redirect(new URL('/app', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/register', '/admin/:path*', '/app/:path*'],
}
