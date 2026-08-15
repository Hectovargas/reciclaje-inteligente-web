/**
 * Tier 2: Boundary & Corner Cases - QR Verification & Replay Protection
 * Validates expired QRs, double claims, forged signatures, unauthorized claims.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { generateCryptographicQR, createTamperedSignature } from '../fixtures/qr.fixture';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerQrReplayBoundaryTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('QR Verification & Replay Protection', 'Tier 2');

  suite.beforeEach(() => {
    harness.reset();
  });

  // BC4.1: Expired QR Token Verification -> 400 Bad Request
  suite.it('BC4.1: Verification of an expired QR token (>10 min TTL) fails with "QR vencido"', async () => {
    const expiredQR = await generateCryptographicQR('Plástico', TEST_CONSTANTS.ADMIN_PRIVATE_KEY, { expired: true });
    harness.qrTokens.set(expiredQR.codigo, expiredQR);

    const res = await harness.request('GET', `/api/v1/qr/verificar?codigo=${expiredQR.codigo}&firma=${encodeURIComponent(expiredQR.firma)}`);

    expect(res.status).toBe(400);
    expect(res.data.message).toContain('QR vencido');
  });

  // BC4.2: Replay Attack (Double Claim) Prevention
  suite.it('BC4.2: Double claim attempt on already claimed QR token returns 400 "QR ya fue usado"', async () => {
    // 1. Generate valid QR
    const qr = await generateCryptographicQR('Metal');
    harness.qrTokens.set(qr.codigo, qr);

    // 2. Login as Alice
    const loginRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });

    // 3. First claim (Success)
    const firstClaim = await harness.request('POST', '/api/v1/qr/reclamar', {
      cookies: loginRes.cookies,
      body: { token: qr.codigo },
    });
    expect(firstClaim.status).toBe(200);
    expect(firstClaim.data.success).toBe(true);

    // 4. Second claim on same token (Replay Attack)
    const secondClaim = await harness.request('POST', '/api/v1/qr/reclamar', {
      cookies: loginRes.cookies,
      body: { token: qr.codigo },
    });
    expect(secondClaim.status).toBe(400);
    expect(secondClaim.data.message).toContain('QR ya fue usado');
  });

  // BC4.3: Tampered ECDSA Cryptographic Signature
  suite.it('BC4.3: Tampered or forged ECDSA signature fails verification with 400 Bad Request', async () => {
    const qr = await generateCryptographicQR('Plástico');
    const forgedFirma = createTamperedSignature(qr.firma);
    harness.qrTokens.set(qr.codigo, { ...qr, firma: forgedFirma });

    const res = await harness.request('GET', `/api/v1/qr/verificar?codigo=${qr.codigo}&firma=${encodeURIComponent(forgedFirma)}`);

    expect(res.status).toBe(400);
    expect(res.data.message).toContain('inválida');
  });

  // BC4.4: Non-Existent QR Code -> 400 Bad Request
  suite.it('BC4.4: Verification of arbitrary non-existent QR token returns 400 "QR no encontrado"', async () => {
    const randomCode = 'QR-FAKE-999999999';
    const res = await harness.request('GET', `/api/v1/qr/verificar?codigo=${randomCode}&firma=0x1234`);

    expect(res.status).toBe(400);
    expect(res.data.message).toContain('QR no encontrado');
  });

  // BC4.5: Claiming Without Authentication -> 401 Unauthorized
  suite.it('BC4.5: Unauthenticated claim attempt on valid QR returns 401 Unauthorized', async () => {
    const qr = await generateCryptographicQR('Plástico');
    harness.qrTokens.set(qr.codigo, qr);

    // No session cookies
    const res = await harness.request('POST', '/api/v1/qr/reclamar', {
      body: { token: qr.codigo },
      cookies: {},
    });

    expect(res.status).toBe(401);
  });
}
