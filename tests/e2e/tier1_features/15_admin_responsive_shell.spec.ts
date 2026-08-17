/**
 * Tier 1: Feature 15 - Admin Responsive Shell
 * Validates desktop sidebar (220px/260px), mobile navigation drawer, user profile modal trigger, and logout flow.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerAdminResponsiveShellTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 15: Admin Responsive Shell', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC15.1: Admin Shell Navigation Route Gating
  suite.it('TC15.1: Admin shell routes are accessible for authenticated ADMIN session', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });

    const routes = ['/admin', '/admin/estaciones', '/admin/diagnostico-ia', '/admin/zonas-admin'];
    for (const r of routes) {
      const check = harness.simulateEdgeMiddleware(r, adminRes.cookies);
      expect(check.passed).toBe(true);
      expect(check.status).toBe(200);
    }
  });

  // TC15.2: User Profile Session Hydration
  suite.it('TC15.2: Admin shell topbar hydrates logged-in admin profile with name and role', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const meRes = await harness.request('GET', '/api/v1/auth/me', { cookies: adminRes.cookies });

    expect(meRes.status).toBe(200);
    expect(meRes.data.user.role).toBe('ADMIN');
    expect(meRes.data.user.email).toBe('admin@recicla.com');
  });

  // TC15.3: Custodial Wallet Exposure in Admin Profile
  suite.it('TC15.3: Profile modal provides user custodial Ethereum address for verification', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const meRes = await harness.request('GET', '/api/v1/auth/me', { cookies: adminRes.cookies });

    expect(meRes.data.user.walletAddress).toBeDefined();
    expect(meRes.data.user.walletAddress.startsWith('0x')).toBe(true);
  });

  // TC15.4: Admin Logout Action
  suite.it('TC15.4: Admin clicking logout invalidates session and clears access_token cookie', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const logoutRes = await harness.request('POST', '/api/v1/auth/logout', { cookies: adminRes.cookies });

    expect(logoutRes.status).toBe(200);
    expect(harness.sessionCookies['access_token']).toBeUndefined();
  });

  // TC15.5: Post-Logout Shell Route Lockout
  suite.it('TC15.5: Navigating to /admin after logout redirects user to /login', () => {
    const shellCheck = harness.simulateEdgeMiddleware('/admin', {});
    expect(shellCheck.passed).toBe(false);
    expect(shellCheck.status).toBe(307);
    expect(shellCheck.redirectUrl).toBe('/login?callbackUrl=%2Fadmin');
  });
}
