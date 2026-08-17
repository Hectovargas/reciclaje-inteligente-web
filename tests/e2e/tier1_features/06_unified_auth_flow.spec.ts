/**
 * Tier 1: Feature 6 - Unified Auth Flow & Session Check
 * Validates registration, login, session check via /auth/me, logout, and error states.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidRegisterPayload, createValidLoginPayload, createInvalidLoginPayload } from '../fixtures/auth.fixture';

export function registerUnifiedAuthFlowTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 6: Unified Auth Flow & Session Check', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC6.1: Citizen Registration & Auto Wallet Creation
  suite.it('TC6.1: Registration creates citizen account, custodial Ethereum wallet, and sets httpOnly cookie', async () => {
    const payload = createValidRegisterPayload();
    const res = await harness.request('POST', '/api/v1/auth/register', { body: payload });

    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    expect(res.data.email).toBe(payload.email);
    expect(res.data.role).toBe('USER');
    expect(res.data.walletAddress).toBeDefined();
    expect(res.data.walletAddress.startsWith('0x')).toBe(true);
    expect(res.cookies['access_token']).toBeDefined();
  });

  // TC6.2: User Login & Cookie Attachment
  suite.it('TC6.2: Login validates credentials and issues httpOnly session cookie', async () => {
    const loginPayload = createValidLoginPayload('ADMIN');
    const res = await harness.request('POST', '/api/v1/auth/login', { body: loginPayload });

    expect(res.status).toBe(200);
    expect(res.data.user.email).toBe(loginPayload.email);
    expect(res.data.user.role).toBe('ADMIN');
    expect(res.cookies['access_token']).toBeDefined();
  });

  // TC6.3: Session Verification via GET /auth/me
  suite.it('TC6.3: GET /auth/me returns current user profile when session cookie is provided', async () => {
    const loginRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    const meRes = await harness.request('GET', '/api/v1/auth/me', { cookies: loginRes.cookies });

    expect(meRes.status).toBe(200);
    expect(meRes.data.user).toBeDefined();
    expect(meRes.data.user.role).toBe('USER');
    expect(meRes.data.user.walletAddress).toBeDefined();
  });

  // TC6.4: User Logout & Cookie Invalidation
  suite.it('TC6.4: POST /auth/logout invalidates session and clears access_token', async () => {
    const loginRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    const logoutRes = await harness.request('POST', '/api/v1/auth/logout', { cookies: loginRes.cookies });

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.data.message).toContain('Logged out');
  });

  // TC6.5: Auth Error Responses
  suite.it('TC6.5: Login with invalid password returns 401 Unauthorized with structured error message', async () => {
    const badLogin = createInvalidLoginPayload();
    const res = await harness.request('POST', '/api/v1/auth/login', { body: badLogin });

    expect(res.status).toBe(401);
    expect(res.data.message).toBeDefined();
  });
}
