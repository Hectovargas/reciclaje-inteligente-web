/**
 * Tier 1: Feature 4 - Route Protection /app/**
 * Validates citizen route protection, login redirections, and session gating.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerRouteProtectionAppTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 4: Route Protection /app/**', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC4.1: Authenticated Citizen Allowed Access to /app
  suite.it('TC4.1: Authenticated user with role USER can access /app', async () => {
    const loginRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    expect(loginRes.status).toBe(200);

    const appCheck = harness.simulateEdgeMiddleware('/app', loginRes.cookies);
    expect(appCheck.passed).toBe(true);
    expect(appCheck.status).toBe(200);
    expect(appCheck.role).toBe('USER');
  });

  // TC4.2: Unauthenticated Citizen Redirected to /login
  suite.it('TC4.2: Unauthenticated request to /app is redirected to /login?callbackUrl=%2Fapp', () => {
    const unauthCheck = harness.simulateEdgeMiddleware('/app', {});
    expect(unauthCheck.passed).toBe(false);
    expect(unauthCheck.status).toBe(307);
    expect(unauthCheck.redirectUrl).toBe('/login?callbackUrl=%2Fapp');
  });

  // TC4.3: Mid-Session Expiry Gating
  suite.it('TC4.3: Navigation with expired session cookie redirects to /login on next request', async () => {
    const userRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    const expiredToken = harness.vault.generateExpiredJwt(userRes.data.user.email);

    const expiryCheck = harness.simulateEdgeMiddleware('/app', { access_token: expiredToken });
    expect(expiryCheck.passed).toBe(false);
    expect(expiryCheck.status).toBe(307);
    expect(expiryCheck.redirectUrl).toContain('/login');
  });

  // TC4.4: PWA App Shell Direct Linking with Valid Cookie
  suite.it('TC4.4: Opening PWA directly to /app with valid cookie renders immediately', async () => {
    const loginRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    const directLinkCheck = harness.simulateEdgeMiddleware('/app', loginRes.cookies);

    expect(directLinkCheck.passed).toBe(true);
    expect(directLinkCheck.status).toBe(200);
  });

  // TC4.5: Unauthenticated Claim Gating
  suite.it('TC4.5: Unauthenticated attempts to claim rewards return 401 Unauthorized prompting session', async () => {
    const res = await harness.request('POST', '/api/v1/qr/reclamar', {
      body: { token: 'QR-DEMO-123' },
      cookies: {},
    });

    expect(res.status).toBe(401);
    expect(res.data.message).toContain('login required');
  });
}
