/**
 * Tier 1: Feature 17 - Camera QR Scanner (html5-qrcode)
 * Validates camera QR scanner lifecycle, decoded token ingestion, and verification integration.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { generateCryptographicQR } from '../fixtures/qr.fixture';

export function registerCameraQrScannerTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 17: Camera QR Scanner (html5-qrcode)', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC17.1: Decoded QR String Validation Pipeline
  suite.it('TC17.1: Decoded QR code from camera scanner is verified via GET /qr/verificar', async () => {
    const qr = await generateCryptographicQR('Plástico');
    harness.qrTokens.set(qr.codigo, qr);

    const verifRes = await harness.request('GET', `/api/v1/qr/verificar?codigo=${qr.codigo}&firma=${encodeURIComponent(qr.firma)}`);
    expect(verifRes.status).toBe(200);
    expect(verifRes.data.valido).toBe(true);
    expect(verifRes.data.categoria).toBe('Plástico');
    expect(verifRes.data.puntos).toBe(10);
  });

  // TC17.2: Scanner Replay Prevention
  suite.it('TC17.2: Scanning a previously claimed QR code returns 400 "QR ya fue usado"', async () => {
    const qr = await generateCryptographicQR('Metal');
    qr.usado = true;
    harness.qrTokens.set(qr.codigo, qr);

    const verifRes = await harness.request('GET', `/api/v1/qr/verificar?codigo=${qr.codigo}&firma=${encodeURIComponent(qr.firma)}`);
    expect(verifRes.status).toBe(400);
    expect(verifRes.data.message).toContain('QR ya fue usado');
  });

  // TC17.3: Expired Scanned QR Code
  suite.it('TC17.3: Scanning a QR code with expired TTL returns 400 "QR vencido"', async () => {
    const qr = await generateCryptographicQR('Papel', undefined, { expired: true });
    harness.qrTokens.set(qr.codigo, qr);

    const verifRes = await harness.request('GET', `/api/v1/qr/verificar?codigo=${qr.codigo}&firma=${encodeURIComponent(qr.firma)}`);
    expect(verifRes.status).toBe(400);
    expect(verifRes.data.message).toContain('QR vencido');
  });

  // TC17.4: Non-Existent QR Decoding
  suite.it('TC17.4: Scanning an unseeded or random QR string returns 400 "QR no encontrado"', async () => {
    const verifRes = await harness.request('GET', '/api/v1/qr/verificar?codigo=QR-RANDOM-INVALID-999');
    expect(verifRes.status).toBe(400);
    expect(verifRes.data.message).toContain('QR no encontrado');
  });

  // TC17.5: Missing Query Parameters Handling
  suite.it('TC17.5: Querying /qr/verificar without codigo parameter returns 400 Bad Request', async () => {
    const verifRes = await harness.request('GET', '/api/v1/qr/verificar');
    expect(verifRes.status).toBe(400);
    expect(verifRes.data.message).toContain('codigo parameter is required');
  });
}
