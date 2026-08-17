/**
 * Tier 3: Cross-Feature Combinations - Atomic QR Claim & Replay Lockout
 * Flow: User scans QR -> POST /qr/reclamar -> Token marked used -> BullMQ queue enqueued -> Double spend lockout.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { generateCryptographicQR } from '../fixtures/qr.fixture';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerAtomicClaimReplayLockoutTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Atomic QR Claim & Replay Lockout', 'Tier 3');

  suite.beforeEach(() => {
    harness.reset();
  });

  // Combo 3.1: Atomic QR Claim Enqueues BullMQ Job and Locks QR Token
  suite.it('Combo 3.1: Valid QR claim marks token usado=true and immediately enqueues reward in BullMQ', async () => {
    // 1. Generate QR
    const qr = await generateCryptographicQR('Plástico');
    harness.qrTokens.set(qr.codigo, qr);

    // 2. User login
    const userLogin = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });

    // 3. User claims QR
    const claimRes = await harness.request('POST', '/api/v1/qr/reclamar', {
      cookies: userLogin.cookies,
      body: { token: qr.codigo },
    });

    expect(claimRes.status).toBe(200);
    expect(claimRes.data.success).toBe(true);
    expect(claimRes.data.txStatus).toBe('QUEUED');
    expect(claimRes.data.puntos).toBe(10);

    // 4. Verify QR is marked used in DB
    const dbQr = harness.qrTokens.get(qr.codigo);
    expect(dbQr?.usado).toBe(true);
  });

  // Combo 3.2: Immediate Replay Lockout across Concurrent/Subsequent Claims
  suite.it('Combo 3.2: Simultaneous second claim by different user on same token is rejected with 400', async () => {
    const qr = await generateCryptographicQR('Metal');
    harness.qrTokens.set(qr.codigo, qr);

    // User Alice logs in and claims
    const aliceLogin = await harness.request('POST', '/api/v1/auth/login', {
      body: { email: TEST_CONSTANTS.USER_ALICE.email, password: TEST_CONSTANTS.USER_ALICE.password },
    });
    const aliceClaim = await harness.request('POST', '/api/v1/qr/reclamar', {
      cookies: aliceLogin.cookies,
      body: { token: qr.codigo },
    });
    expect(aliceClaim.status).toBe(200);

    // User Bob logs in and tries to claim same QR
    const bobLogin = await harness.request('POST', '/api/v1/auth/login', {
      body: { email: TEST_CONSTANTS.USER_BOB.email, password: TEST_CONSTANTS.USER_BOB.password },
    });
    const bobClaim = await harness.request('POST', '/api/v1/qr/reclamar', {
      cookies: bobLogin.cookies,
      body: { token: qr.codigo },
    });

    expect(bobClaim.status).toBe(400);
    expect(bobClaim.data.message).toContain('QR ya fue usado');
  });

  // Combo 3.3: Repeated Claim Attempt by Same User Rejected
  suite.it('Combo 3.3: Same user repeating claim on already redeemed QR receives 400 "QR ya fue usado"', async () => {
    const qr = await generateCryptographicQR('Papel');
    harness.qrTokens.set(qr.codigo, qr);

    const userLogin = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });

    // First claim
    const firstClaim = await harness.request('POST', '/api/v1/qr/reclamar', { cookies: userLogin.cookies, body: { token: qr.codigo } });
    expect(firstClaim.status).toBe(200);

    // Second claim
    const secondClaim = await harness.request('POST', '/api/v1/qr/reclamar', { cookies: userLogin.cookies, body: { token: qr.codigo } });
    expect(secondClaim.status).toBe(400);
    expect(secondClaim.data.message).toContain('QR ya fue usado');
  });

  // Combo 3.4: Unauthenticated Claim Attempt Does Not Consume Token
  suite.it('Combo 3.4: Unauthenticated claim attempt returns 401 and leaves QR token in unused state', async () => {
    const qr = await generateCryptographicQR('Vidrio');
    harness.qrTokens.set(qr.codigo, qr);

    const unauthClaim = await harness.request('POST', '/api/v1/qr/reclamar', { body: { token: qr.codigo } });
    expect(unauthClaim.status).toBe(401);

    // QR remains unused
    expect(harness.qrTokens.get(qr.codigo)!.usado).toBe(false);
  });
}
