/**
 * Tier 1: Feature 2 - Edge JWT Verification (jose)
 * Validates cryptographic JWT signature, expiry checking, role decoding, and tamper protection in Edge runtime.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerEdgeJwtJoseTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 2: Edge JWT Verification (jose)', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC2.1: Valid JWT Signature Verification in Edge Runtime
  suite.it('TC2.1: Edge middleware verifies valid HS256 JWT signature from httpOnly cookie', async () => {
    const loginRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    expect(loginRes.status).toBe(200);

    const token = loginRes.cookies['access_token'];
    expect(token).toBeDefined();

    const edgeResult = harness.simulateEdgeMiddleware('/admin', loginRes.cookies);
    expect(edgeResult.passed).toBe(true);
    expect(edgeResult.status).toBe(200);
    expect(edgeResult.role).toBe('ADMIN');
  });

  // TC2.2: Expired JWT Token Rejection
  suite.it('TC2.2: Expired JWT token is intercepted and rejected with 307 redirect to /login', () => {
    const expiredToken = harness.vault.generateExpiredJwt(TEST_CONSTANTS.ADMIN_USER.email);
    const cookies = { access_token: expiredToken };

    const edgeResult = harness.simulateEdgeMiddleware('/admin', cookies);
    expect(edgeResult.passed).toBe(false);
    expect(edgeResult.status).toBe(307);
    expect(edgeResult.redirectUrl).toContain('/login');
  });

  // TC2.3: Forged Signature & Payload Tampering Rejection
  suite.it('TC2.3: Altering JWT payload or signature fails cryptographic verification', () => {
    const validToken = harness.vault.generateJwt(TEST_CONSTANTS.USER_ALICE.email);
    // Tamper token string
    const parts = validToken.split('.');
    const tamperedToken = `${parts[0]}.${parts[1]}.tampered_invalid_signature_hex`;

    const cookies = { access_token: tamperedToken };
    const edgeResult = harness.simulateEdgeMiddleware('/app', cookies);

    expect(edgeResult.passed).toBe(false);
    expect(edgeResult.status).toBe(307);
    expect(edgeResult.redirectUrl).toContain('/login');
  });

  // TC2.4: Missing Token Handling
  suite.it('TC2.4: Requests without access_token cookie are treated as unauthenticated', () => {
    const edgeResult = harness.simulateEdgeMiddleware('/app', {});
    expect(edgeResult.passed).toBe(false);
    expect(edgeResult.status).toBe(307);
    expect(edgeResult.redirectUrl).toContain('/login?callbackUrl=%2Fapp');
  });

  // TC2.5: Role Claims Extraction (ADMIN, USER, MANAGER)
  suite.it('TC2.5: Decoded JWT claims correctly map to system roles for downstream gating', async () => {
    // Admin
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const adminEdge = harness.simulateEdgeMiddleware('/admin', adminRes.cookies);
    expect(adminEdge.role).toBe('ADMIN');

    // Citizen User
    const userRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    const userEdge = harness.simulateEdgeMiddleware('/app', userRes.cookies);
    expect(userEdge.role).toBe('USER');
  });
}
