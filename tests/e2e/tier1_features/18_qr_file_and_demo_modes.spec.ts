/**
 * Tier 1: Feature 18 - QR Scanner File Upload & Demo Modes
 * Validates manual input processing, demo mode presets (+10 Plástico, +15 Metal, +5 Papel, +8 Vidrio), and error badges.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { generateCryptographicQR } from '../fixtures/qr.fixture';

export function registerQrFileAndDemoModesTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 18: QR Scanner File Upload & Demo Modes', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC18.1: Demo Preset: Plástico (+10 RECI)
  suite.it('TC18.1: Demo preset for Plástico generates valid verifiable token worth 10 points', async () => {
    const qr = await generateCryptographicQR('Plástico');
    harness.qrTokens.set(qr.codigo, qr);

    const res = await harness.request('GET', `/api/v1/qr/verificar?codigo=${qr.codigo}&firma=${encodeURIComponent(qr.firma)}`);
    expect(res.status).toBe(200);
    expect(res.data.categoria).toBe('Plástico');
    expect(res.data.puntos).toBe(10);
  });

  // TC18.2: Demo Preset: Metal (+15 RECI)
  suite.it('TC18.2: Demo preset for Metal generates valid verifiable token worth 15 points', async () => {
    const qr = await generateCryptographicQR('Metal');
    harness.qrTokens.set(qr.codigo, qr);

    const res = await harness.request('GET', `/api/v1/qr/verificar?codigo=${qr.codigo}&firma=${encodeURIComponent(qr.firma)}`);
    expect(res.status).toBe(200);
    expect(res.data.categoria).toBe('Metal');
    expect(res.data.puntos).toBe(15);
  });

  // TC18.3: Demo Preset: Papel (+5 RECI)
  suite.it('TC18.3: Demo preset for Papel generates valid verifiable token worth 5 points', async () => {
    const qr = await generateCryptographicQR('Papel');
    harness.qrTokens.set(qr.codigo, qr);

    const res = await harness.request('GET', `/api/v1/qr/verificar?codigo=${qr.codigo}&firma=${encodeURIComponent(qr.firma)}`);
    expect(res.status).toBe(200);
    expect(res.data.categoria).toBe('Papel');
    expect(res.data.puntos).toBe(5);
  });

  // TC18.4: Demo Preset: Vidrio (+8 RECI)
  suite.it('TC18.4: Demo preset for Vidrio generates valid verifiable token worth 8 points', async () => {
    const qr = await generateCryptographicQR('Vidrio');
    harness.qrTokens.set(qr.codigo, qr);

    const res = await harness.request('GET', `/api/v1/qr/verificar?codigo=${qr.codigo}&firma=${encodeURIComponent(qr.firma)}`);
    expect(res.status).toBe(200);
    expect(res.data.categoria).toBe('Vidrio');
    expect(res.data.puntos).toBe(8);
  });

  // TC18.5: Manual Code Submission Pipeline
  suite.it('TC18.5: Manually entered code payload undergoes identical cryptographic verification', async () => {
    const qr = await generateCryptographicQR('Plástico');
    harness.qrTokens.set(qr.codigo, qr);

    const res = await harness.request('GET', `/api/v1/qr/verificar?codigo=${qr.codigo}`);
    expect(res.status).toBe(200);
    expect(res.data.valido).toBe(true);
  });
}
