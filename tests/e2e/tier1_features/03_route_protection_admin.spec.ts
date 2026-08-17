/**
 * Tier 1: Feature 3 - Route Protection /admin/**
 * Validates role-based access gating for /admin/** exclusively for role === 'ADMIN'.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerRouteProtectionAdminTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 3: Route Protection /admin/**', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC3.1: ADMIN Role Allowed Access to /admin/**
  suite.it('TC3.1: Authenticated user with role ADMIN can access all /admin subroutes', async () => {
    const loginRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    expect(loginRes.status).toBe(200);

    const checkOverview = harness.simulateEdgeMiddleware('/admin', loginRes.cookies);
    expect(checkOverview.passed).toBe(true);
    expect(checkOverview.status).toBe(200);

    const checkStations = harness.simulateEdgeMiddleware('/admin/estaciones', loginRes.cookies);
    expect(checkStations.passed).toBe(true);
    expect(checkStations.status).toBe(200);

    const checkDiagnostics = harness.simulateEdgeMiddleware('/admin/diagnostico-ia', loginRes.cookies);
    expect(checkDiagnostics.passed).toBe(true);
    expect(checkDiagnostics.status).toBe(200);
  });

  // TC3.2: Unauthenticated Request Redirected to /login
  suite.it('TC3.2: Unauthenticated request to /admin/** is redirected to /login with callbackUrl', () => {
    const unauthCheck = harness.simulateEdgeMiddleware('/admin/estaciones', {});
    expect(unauthCheck.passed).toBe(false);
    expect(unauthCheck.status).toBe(307);
    expect(unauthCheck.redirectUrl).toBe('/login?callbackUrl=%2Fadmin%2Festaciones');
  });

  // TC3.3: Citizen User (USER role) Blocked from /admin/**
  suite.it('TC3.3: Citizen user with role USER is blocked from /admin and redirected to /app', async () => {
    const loginRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    expect(loginRes.status).toBe(200);

    const citizenCheck = harness.simulateEdgeMiddleware('/admin', loginRes.cookies);
    expect(citizenCheck.passed).toBe(false);
    expect(citizenCheck.status).toBe(307);
    expect(citizenCheck.redirectUrl).toBe('/app');
  });

  // TC3.4: Deep Admin Subroute Protection (/admin/zonas/[id])
  suite.it('TC3.4: Deep dynamic nested admin subroutes (/admin/zonas/123) enforce ADMIN requirement', async () => {
    const userRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    const deepCheck = harness.simulateEdgeMiddleware('/admin/zonas/zone-uuid-downtown-01', userRes.cookies);

    expect(deepCheck.passed).toBe(false);
    expect(deepCheck.status).toBe(307);
    expect(deepCheck.redirectUrl).toBe('/app');
  });

  // TC3.5: Preservation of Target URL in callbackUrl Query Param
  suite.it('TC3.5: Target admin subroute is preserved in callbackUrl query parameter during unauthenticated intercept', () => {
    const targetUrl = '/admin/diagnostico-ia';
    const intercept = harness.simulateEdgeMiddleware(targetUrl, {});

    expect(intercept.redirectUrl).toBe(`/login?callbackUrl=${encodeURIComponent(targetUrl)}`);
  });
}
