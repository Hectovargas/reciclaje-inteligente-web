/**
 * Tier 1: Feature 5 - Root Conditional Redirector /
 * Validates root URL dispatching based on authentication state and user role.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerRootRedirectorTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 5: Root Conditional Redirector /', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC5.1: Root Redirect for Unauthenticated Visitor -> /login
  suite.it('TC5.1: Visiting root / without session redirects to /login', () => {
    const rootCheck = harness.simulateEdgeMiddleware('/', {});
    expect(rootCheck.passed).toBe(false);
    expect(rootCheck.status).toBe(307);
    expect(rootCheck.redirectUrl).toBe('/login');
  });

  // TC5.2: Root Redirect for ADMIN -> /admin
  suite.it('TC5.2: Visiting root / with active ADMIN session redirects to /admin', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    expect(adminRes.status).toBe(200);

    const rootAdminCheck = harness.simulateEdgeMiddleware('/', adminRes.cookies);
    expect(rootAdminCheck.passed).toBe(false);
    expect(rootAdminCheck.status).toBe(307);
    expect(rootAdminCheck.redirectUrl).toBe('/admin');
  });

  // TC5.3: Root Redirect for Citizen USER -> /app
  suite.it('TC5.3: Visiting root / with active USER session redirects to /app', async () => {
    const userRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    expect(userRes.status).toBe(200);

    const rootUserCheck = harness.simulateEdgeMiddleware('/', userRes.cookies);
    expect(rootUserCheck.passed).toBe(false);
    expect(rootUserCheck.status).toBe(307);
    expect(rootUserCheck.redirectUrl).toBe('/app');
  });

  // TC5.4: Public Route Bypass for Authenticated Users
  suite.it('TC5.4: Visiting /login or /register with active ADMIN session redirects to /admin', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });

    const loginCheck = harness.simulateEdgeMiddleware('/login', adminRes.cookies);
    expect(loginCheck.passed).toBe(false);
    expect(loginCheck.status).toBe(307);
    expect(loginCheck.redirectUrl).toBe('/admin');
  });

  // TC5.5: Public Route Access for Unauthenticated Visitors
  suite.it('TC5.5: Visiting /login or /register without session allows 200 OK access', () => {
    const loginCheck = harness.simulateEdgeMiddleware('/login', {});
    expect(loginCheck.passed).toBe(true);
    expect(loginCheck.status).toBe(200);

    const registerCheck = harness.simulateEdgeMiddleware('/register', {});
    expect(registerCheck.passed).toBe(true);
    expect(registerCheck.status).toBe(200);
  });
}
