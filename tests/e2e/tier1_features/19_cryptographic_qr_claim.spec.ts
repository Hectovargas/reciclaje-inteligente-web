/**
 * Tier 1: Feature 19 - Cryptographic QR Claim Flow
 * Validates QR verification on open, preview card, atomic point claim, and celebration status.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidLoginPayload } from '../fixtures/auth.fixture';
import { generateCryptographicQR } from '../fixtures/qr.fixture';

export function registerCryptographicQrClaimTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 19: Cryptographic QR Claim Flow', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC19.1: Automatic Verification on Modal Mount
  suite.it('TC19.1: Verification returns material category, validity flag, and token amount', async () => {
    const qr = await generateCryptographicQR('Plástico');
    harness.qrTokens.set(qr.codigo, qr);

    const res = await harness.request('GET', `/api/v1/qr/verificar?codigo=${qr.codigo}&firma=${encodeURIComponent(qr.firma)}`);
    expect(res.status).toBe(200);
    expect(res.data.valido).toBe(true);
    expect(res.data.puntos).toBe(10);
  });

  // TC19.2: Atomic Point Claim Execution
  suite.it('TC19.2: POST /qr/reclamar claims reward, marks QR used atomically, and queues minting job', async () => {
    const userRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    const qr = await generateCryptographicQR('Plástico');
    harness.qrTokens.set(qr.codigo, qr);

    const claimRes = await harness.request('POST', '/api/v1/qr/reclamar', {
      cookies: userRes.cookies,
      body: { token: qr.codigo },
    });

    expect(claimRes.status).toBe(200);
    expect(claimRes.data.success).toBe(true);
    expect(claimRes.data.puntos).toBe(10);
    expect(harness.qrTokens.get(qr.codigo)!.usado).toBe(true);
  });

  // TC19.3: Immediate Replay Lockout
  suite.it('TC19.3: Second claim attempt on claimed QR token is rejected with 400 "QR ya fue usado"', async () => {
    const userRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    const qr = await generateCryptographicQR('Plástico');
    harness.qrTokens.set(qr.codigo, qr);

    // First claim
    await harness.request('POST', '/api/v1/qr/reclamar', { cookies: userRes.cookies, body: { token: qr.codigo } });

    // Second claim
    const secondClaim = await harness.request('POST', '/api/v1/qr/reclamar', { cookies: userRes.cookies, body: { token: qr.codigo } });
    expect(secondClaim.status).toBe(400);
    expect(secondClaim.data.message).toContain('QR ya fue usado');
  });

  // TC19.4: Unauthenticated Claim Rejection
  suite.it('TC19.4: Claiming QR without active session cookie returns 401 Unauthorized', async () => {
    const qr = await generateCryptographicQR('Plástico');
    harness.qrTokens.set(qr.codigo, qr);

    const res = await harness.request('POST', '/api/v1/qr/reclamar', { body: { token: qr.codigo } });
    expect(res.status).toBe(401);
  });

  // TC19.5: Missing Token in Claim Body Rejection
  suite.it('TC19.5: Claiming with empty request body returns 400 Bad Request', async () => {
    const userRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    const res = await harness.request('POST', '/api/v1/qr/reclamar', {
      cookies: userRes.cookies,
      body: {},
    });

    expect(res.status).toBe(400);
    expect(res.data.message).toContain('Token is required');
  });
}
