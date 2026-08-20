const withPWAInit = require('@ducanh2912/next-pwa').default;
const defaultRuntimeCaching = require('@ducanh2912/next-pwa').runtimeCaching;

/**
 * Custom Workbox Runtime Caching Rules
 *
 * Strict Isolation Rules:
 * 1. Prepend NetworkOnly rule for /admin/** and /api/** so they are NEVER cached or intercepted.
 * 2. Filter out the default 'apis' caching entry to prevent caching backend REST calls.
 * 3. Update 'pages', 'pages-rsc', and 'pages-rsc-prefetch' rules to exclude /admin routes.
 */
const customRuntimeCaching = [
  // 1. Explicitly bypass /admin/** and /api/** with NetworkOnly
  {
    urlPattern: /^\/(admin|api)(\/.*)?$/i,
    handler: 'NetworkOnly',
  },
  // 2. Filter default rules: remove 'apis' and adjust page rules to exclude /admin
  ...defaultRuntimeCaching
    .filter((entry) => entry.options?.cacheName !== 'apis')
    .map((entry) => {
      const cacheName = entry.options?.cacheName;
      if (cacheName === 'pages-rsc-prefetch') {
        return {
          ...entry,
          urlPattern: ({ url, sameOrigin, request }) => {
            const pathname = url ? url.pathname : '';
            if (!sameOrigin || pathname.startsWith('/api') || pathname.startsWith('/admin')) {
              return false;
            }
            return (
              request?.headers?.get('RSC') === '1' &&
              request?.headers?.get('Next-Router-Prefetch') === '1'
            );
          },
        };
      }
      if (cacheName === 'pages-rsc') {
        return {
          ...entry,
          urlPattern: ({ url, sameOrigin, request }) => {
            const pathname = url ? url.pathname : '';
            if (!sameOrigin || pathname.startsWith('/api') || pathname.startsWith('/admin')) {
              return false;
            }
            return request?.headers?.get('RSC') === '1';
          },
        };
      }
      if (cacheName === 'pages') {
        return {
          ...entry,
          urlPattern: ({ url, sameOrigin }) => {
            const pathname = url ? url.pathname : '';
            if (!sameOrigin || pathname.startsWith('/api') || pathname.startsWith('/admin')) {
              return false;
            }
            return true;
          },
        };
      }
      return entry;
    }),
];

/**
 * Configure @ducanh2912/next-pwa plugin
 */
const withPWA = withPWAInit({
  dest: 'public',
  scope: '/app',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  reloadOnOnline: true,
  dynamicStartUrl: true,
  dynamicStartUrlRedirect: '/app',
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    disableDevLogs: true,
    // Ensure Workbox navigation fallback never triggers on admin or API routes
    navigateFallbackDenylist: [
      /^\/admin/,
      /^\/api/,
    ],
    runtimeCaching: customRuntimeCaching,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    let backendUrl = (
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3001'
    ).trim().replace(/\/$/, '');

    if (backendUrl && !backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
      backendUrl = `https://${backendUrl}`;
    }

    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
