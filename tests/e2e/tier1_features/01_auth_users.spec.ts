/**
 * Tier 1: Feature Coverage - Auth & User Management
 * Validates R1 requirements: registration, login, JWT cookies, profile retrieval, logout, custodial wallets.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidRegisterPayload, createValidLoginPayload } from '../fixtures/auth.fixture';
import { TEST_CONSTANTS } from '../config/test-constants';

export function registerAuthUserTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Auth & User Lifecycle (F1, F2 / R1)', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC1.1: User Registration
  suite.it('TC1.1: Register new citizen user returns 201, profile data and httpOnly cookie', async () => {
    const payload = createValidRegisterPayload();
    const res = await harness.request('POST', '/api/v1/auth/register', { body: payload });

    expect(res.status).toBe(201);
    expect(res.data.email).toBe(payload.email);
    expect(res.data.name).toBe(payload.name);
    expect(res.data.role).toBe('USER');
    expect(res.data.walletAddress).toBeDefined();
    expect(res.data.walletAddress.startsWith('0x')).toBeTruthy();
    expect(res.cookies['access_token']).toBeDefined();
    expect(res.headers['set-cookie']?.toString()).toContain('HttpOnly');
  });

  // TC1.2: User Login
  suite.it('TC1.2: Login with valid credentials returns 200, user entity, and sets access_token cookie', async () => {
    const loginPayload = createValidLoginPayload('ADMIN');
    const res = await harness.request('POST', '/api/v1/auth/login', { body: loginPayload });

    expect(res.status).toBe(200);
    expect(res.data.user).toBeDefined();
    expect(res.data.user.email).toBe(TEST_CONSTANTS.ADMIN_USER.email);
    expect(res.data.user.role).toBe('ADMIN');
    expect(res.cookies['access_token']).toBeDefined();
    expect(res.headers['set-cookie']?.toString()).toContain('HttpOnly');
  });

  // TC1.3: GET /auth/me Profile Retrieval
  suite.it('TC1.3: GET /auth/me with valid session cookie retrieves authenticated user profile', async () => {
    // Login as Alice
    const loginPayload = createValidLoginPayload('USER');
    const loginRes = await harness.request('POST', '/api/v1/auth/login', { body: loginPayload });
    expect(loginRes.status).toBe(200);

    const meRes = await harness.request('GET', '/api/v1/auth/me', { cookies: loginRes.cookies });
    expect(meRes.status).toBe(200);
    expect(meRes.data.user.email).toBe(TEST_CONSTANTS.USER_ALICE.email);
    expect(meRes.data.user.walletAddress.toLowerCase()).toBe(TEST_CONSTANTS.USER_ALICE.address.toLowerCase());
  });

  // TC1.4: User Logout
  suite.it('TC1.4: POST /auth/logout invalidates session and clears access_token cookie', async () => {
    // Login first
    await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    expect(harness.sessionCookies['access_token']).toBeDefined();

    // Logout
    const logoutRes = await harness.request('POST', '/api/v1/auth/logout');
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.data.message).toBe('Logged out successfully');
    expect(harness.sessionCookies['access_token']).toBeUndefined();

    // Access /auth/me after logout should return 401
    const meRes = await harness.request('GET', '/api/v1/auth/me');
    expect(meRes.status).toBe(401);
  });

  // TC1.5: Custodial Wallet Auto-Generation
  suite.it('TC1.5: Register automatically creates a unique custodial Ethereum wallet address for the user', async () => {
    const u1 = createValidRegisterPayload();
    const u2 = createValidRegisterPayload();

    const res1 = await harness.request('POST', '/api/v1/auth/register', { body: u1 });
    const res2 = await harness.request('POST', '/api/v1/auth/register', { body: u2 });

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(res1.data.walletAddress).toBeDefined();
    expect(res2.data.walletAddress).toBeDefined();
    expect(res1.data.walletAddress.toLowerCase() !== res2.data.walletAddress.toLowerCase()).toBeTruthy();
  });

  // TC1.6: Role-Based Authorization Mapping
  suite.it('TC1.6: Authenticated users carry correct role attributes (ADMIN, MANAGER, USER)', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    expect(adminRes.data.user.role).toBe('ADMIN');

    const managerRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('MANAGER') });
    expect(managerRes.data.user.role).toBe('MANAGER');

    const userRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    expect(userRes.data.user.role).toBe('USER');
  });
}
