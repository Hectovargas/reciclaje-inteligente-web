/**
 * Tier 2: Boundary & Corner Cases - Auth & Security Constraints
 * Validates error codes, malformed payloads, duplicate emails, invalid passwords, rate limits.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createInvalidLoginPayload, createValidRegisterPayload } from '../fixtures/auth.fixture';
import { TEST_CONSTANTS } from '../config/test-constants';

export function registerAuthBoundaryTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Auth Security & Boundary Constraints', 'Tier 2');

  suite.beforeEach(() => {
    harness.reset();
  });

  // BC1.1: Invalid Password -> 401 Unauthorized
  suite.it('BC1.1: Login with incorrect password returns 401 Unauthorized', async () => {
    const res = await harness.request('POST', '/api/v1/auth/login', {
      body: { email: TEST_CONSTANTS.ADMIN_USER.email, password: 'WrongPassword123' },
    });
    expect(res.status).toBe(401);
    expect(res.data.message).toContain('Invalid credentials');
  });

  // BC1.2: Non-Existent User -> 401 Unauthorized
  suite.it('BC1.2: Login with unregistered email returns 401 Unauthorized', async () => {
    const payload = createInvalidLoginPayload();
    const res = await harness.request('POST', '/api/v1/auth/login', { body: payload });
    expect(res.status).toBe(401);
  });

  // BC1.3: Duplicate Email Registration -> 409 Conflict
  suite.it('BC1.3: Registration with already registered email returns 409 Conflict', async () => {
    const payload = createValidRegisterPayload({ email: TEST_CONSTANTS.USER_ALICE.email });
    const res = await harness.request('POST', '/api/v1/auth/register', { body: payload });
    expect(res.status).toBe(409);
    expect(res.data.message).toContain('already exists');
  });

  // BC1.4: Malformed Email -> 400 Bad Request
  suite.it('BC1.4: Registration with malformed email format returns 400 Bad Request', async () => {
    const payload = createValidRegisterPayload({ email: 'not-an-email-at-all' });
    const res = await harness.request('POST', '/api/v1/auth/register', { body: payload });
    expect(res.status).toBe(400);
  });

  // BC1.5: Missing Required Fields -> 400 Bad Request
  suite.it('BC1.5: Registration with missing password or name returns 400 Bad Request', async () => {
    const res1 = await harness.request('POST', '/api/v1/auth/register', {
      body: { email: 'test@example.com', password: '' },
    });
    expect(res1.status).toBe(400);

    const res2 = await harness.request('POST', '/api/v1/auth/register', {
      body: { email: 'test@example.com', name: 'Test' },
    });
    expect(res2.status).toBe(400);
  });

  // BC1.6: Rate Limiting Enforcement on Login (5 req/min)
  suite.it('BC1.6: Rate limiter triggers 429 Too Many Requests after exceeding 5 login attempts', async () => {
    const ipHeaders = { 'x-forwarded-for': '198.51.100.44' };
    const invalidBody = { email: 'rate.limit@test.com', password: 'bad' };

    // Send 5 attempts (allowed)
    for (let i = 0; i < 5; i++) {
      const res = await harness.request('POST', '/api/v1/auth/login', { body: invalidBody, headers: ipHeaders });
      expect(res.status).toBe(401);
    }

    // 6th attempt should be blocked by rate limiter
    const blockedRes = await harness.request('POST', '/api/v1/auth/login', { body: invalidBody, headers: ipHeaders });
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.data.code).toBe('TOO_MANY_REQUESTS');
  });
}
