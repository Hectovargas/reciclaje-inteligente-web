import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

describe('PWA Service Worker & Scoping Isolation (Empirical Verification)', () => {
  const pwaRoot = path.resolve(__dirname, '../../');
  const manifestPath = path.resolve(pwaRoot, 'public/manifest.json');
  const swPath = path.resolve(pwaRoot, 'public/sw.js');

  it('verifies manifest.json defines scope and start_url strictly to /app', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    expect(manifestContent.scope).toBe('/app');
    expect(manifestContent.start_url).toBe('/app');
    expect(manifestContent.id).toBe('/app');
  });

  it('verifies generated sw.js enforces NetworkOnly for /admin/** and /api/**', () => {
    const swExists = fs.existsSync(swPath);
    expect(swExists, `Expected sw.js to exist at ${swPath}`).toBe(true);
    
    const swContent = fs.readFileSync(swPath, 'utf-8');

    // Check NetworkOnly registration for /admin and /api
    expect(swContent).toContain('registerRoute(/^\\/(admin|api)(\\/.*)?$/i,new e.NetworkOnly,"GET")');
    
    // Check apis cache is NOT present
    expect(swContent).not.toContain('cacheName:"apis"');

    // Check precached assets include citizen app routes and offline page
    expect(swContent).toContain('"/app"');
    expect(swContent).toContain('"/offline"');
    expect(swContent).toContain('"/manifest.json"');

    // Admin routes must NEVER be in precache
    expect(swContent).not.toContain('"/admin"');
    expect(swContent).not.toContain('"/admin/estaciones"');
    expect(swContent).not.toContain('"/admin/zonas"');
  });

  describe('Adversarial Route Matching Matrix (NetworkOnly Regex)', () => {
    const networkOnlyRegex = /^\/(admin|api)(\/.*)?$/i;

    const shouldMatchNetworkOnly = [
      '/admin',
      '/admin/',
      '/admin/estaciones',
      '/admin/zonas',
      '/admin/zonas/1',
      '/admin/zonas/zone-42/analytics',
      '/admin/diagnostico-ia',
      '/admin/zonas-admin',
      '/admin/settings/general',
      '/api',
      '/api/',
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/me',
      '/api/v1/auth/logout',
      '/api/v1/qr/verificar',
      '/api/v1/qr/verificar/mock-jwt-token-123',
      '/api/v1/qr/reclamar',
      '/api/v1/estaciones',
      '/api/v1/estaciones/st-001',
      '/api/v1/estaciones/st-001/revoke-token',
      '/api/v1/zonas',
      '/api/v1/zonas/1',
      '/api/v1/blockchain/balance/0x1234567890abcdef',
      '/api/v1/blockchain/transactions/0x1234567890abcdef',
    ];

    const shouldBypassNetworkOnly = [
      '/',
      '/app',
      '/app/',
      '/app/scanner',
      '/app/claim',
      '/app/profile',
      '/login',
      '/register',
      '/offline',
      '/_next/static/chunks/main.js',
      '/icon-192.png',
      '/manifest.json',
    ];

    shouldMatchNetworkOnly.forEach((url) => {
      it(`matches and isolates sensitive route as NetworkOnly: ${url}`, () => {
        expect(networkOnlyRegex.test(url)).toBe(true);
      });
    });

    shouldBypassNetworkOnly.forEach((url) => {
      it(`does NOT match NetworkOnly (preserves normal caching/PWA behavior): ${url}`, () => {
        expect(networkOnlyRegex.test(url)).toBe(false);
      });
    });
  });

  describe('navigateFallbackDenylist Verification', () => {
    const denylistPatterns = [/^\/admin/, /^\/api/];

    const isDenylisted = (pathname: string) =>
      denylistPatterns.some((pattern) => pattern.test(pathname));

    const sensitiveRoutes = [
      '/admin',
      '/admin/',
      '/admin/estaciones',
      '/admin/zonas',
      '/admin/zonas/1',
      '/admin/diagnostico-ia',
      '/admin/zonas-admin',
      '/api/v1/auth/login',
      '/api/v1/auth/me',
      '/api/v1/qr/verificar',
      '/api/v1/qr/reclamar',
      '/api/v1/estaciones',
    ];

    sensitiveRoutes.forEach((route) => {
      it(`blocks fallback to /offline for sensitive route: ${route}`, () => {
        expect(isDenylisted(route)).toBe(true);
      });
    });

    const citizenRoutes = [
      '/app',
      '/app/',
      '/app/rewards',
      '/app/history',
    ];

    citizenRoutes.forEach((route) => {
      it(`allows fallback to /offline for citizen route when offline: ${route}`, () => {
        expect(isDenylisted(route)).toBe(false);
      });
    });
  });

  describe('Workbox Runtime Caching Filter Logic', () => {
    // Replicate customRuntimeCaching urlPattern predicates from next.config.js
    const pageFilter = ({ url, sameOrigin }: { url?: { pathname: string }; sameOrigin: boolean }) => {
      const pathname = url ? url.pathname : '';
      if (!sameOrigin || pathname.startsWith('/api') || pathname.startsWith('/admin')) {
        return false;
      }
      return true;
    };

    const rscFilter = ({
      url,
      sameOrigin,
      request,
    }: {
      url?: { pathname: string };
      sameOrigin: boolean;
      request?: { headers?: { get: (name: string) => string | null } };
    }) => {
      const pathname = url ? url.pathname : '';
      if (!sameOrigin || pathname.startsWith('/api') || pathname.startsWith('/admin')) {
        return false;
      }
      return request?.headers?.get('RSC') === '1';
    };

    it('rejects /admin and /api routes from page runtime caching', () => {
      expect(pageFilter({ url: { pathname: '/admin' }, sameOrigin: true })).toBe(false);
      expect(pageFilter({ url: { pathname: '/admin/estaciones' }, sameOrigin: true })).toBe(false);
      expect(pageFilter({ url: { pathname: '/api/v1/auth/login' }, sameOrigin: true })).toBe(false);
      expect(pageFilter({ url: { pathname: '/api/v1/qr/verificar' }, sameOrigin: true })).toBe(false);
    });

    it('accepts /app routes on same-origin for page runtime caching', () => {
      expect(pageFilter({ url: { pathname: '/app' }, sameOrigin: true })).toBe(true);
      expect(pageFilter({ url: { pathname: '/app/history' }, sameOrigin: true })).toBe(true);
    });

    it('rejects cross-origin requests from page runtime caching', () => {
      expect(pageFilter({ url: { pathname: '/app' }, sameOrigin: false })).toBe(false);
    });

    it('validates RSC headers while rejecting admin routes', () => {
      const rscHeaders = {
        get: (h: string) => (h === 'RSC' ? '1' : null),
      };
      expect(rscFilter({ url: { pathname: '/app' }, sameOrigin: true, request: { headers: rscHeaders } })).toBe(true);
      expect(rscFilter({ url: { pathname: '/admin' }, sameOrigin: true, request: { headers: rscHeaders } })).toBe(false);
    });
  });

  describe('Next.js API Rewrites Logic & Environment Handling', () => {
    // Function that mirrors the rewrites resolution in next.config.js
    const resolveRewrites = (env: { BACKEND_URL?: string; NEXT_PUBLIC_API_URL?: string }) => {
      const backendUrl = (
        env.BACKEND_URL ||
        env.NEXT_PUBLIC_API_URL ||
        'http://localhost:3001'
      ).replace(/\/$/, '');

      return [
        {
          source: '/api/v1/:path*',
          destination: `${backendUrl}/api/v1/:path*`,
        },
      ];
    };

    it('defaults to http://localhost:3001 when no environment variables are set', () => {
      const rewrites = resolveRewrites({});
      expect(rewrites).toEqual([
        {
          source: '/api/v1/:path*',
          destination: 'http://localhost:3001/api/v1/:path*',
        },
      ]);
    });

    it('uses BACKEND_URL when provided and removes trailing slash', () => {
      const rewrites = resolveRewrites({ BACKEND_URL: 'https://api.cleancity.example.com/' });
      expect(rewrites).toEqual([
        {
          source: '/api/v1/:path*',
          destination: 'https://api.cleancity.example.com/api/v1/:path*',
        },
      ]);
    });

    it('falls back to NEXT_PUBLIC_API_URL when BACKEND_URL is not set', () => {
      const rewrites = resolveRewrites({ NEXT_PUBLIC_API_URL: 'http://192.168.1.100:3001' });
      expect(rewrites).toEqual([
        {
          source: '/api/v1/:path*',
          destination: 'http://192.168.1.100:3001/api/v1/:path*',
        },
      ]);
    });
  });
});
