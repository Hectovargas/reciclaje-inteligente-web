/**
 * Tier 3: Cross-Feature Combinations - Classification & QR Verification Pipeline
 * Flow: AI event registered -> Cryptographic QR generated -> User verifies QR signature.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerClassificationQrPipelineTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Classification & QR Pipeline Sync', 'Tier 3');

  suite.beforeEach(() => {
    harness.reset();
  });

  // Combo 2.1: Classification Event to QR Verification Flow
  suite.it('Combo 2.1: Classification event returns valid cryptographic QR that can be immediately verified by client', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;

    // 1. ESP32 deposits classified object
    const classRes = await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': station.provisioningToken },
      body: {
        categoria: 'Plástico',
        confianza: 0.96,
        stationId: station.id,
      },
    });

    expect(classRes.status).toBe(201);
    expect(classRes.data.qr).toBeDefined();

    const qrToken = classRes.data.qr;

    // 2. User client scans and verifies QR
    const verifRes = await harness.request('GET', `/api/v1/qr/verificar?codigo=${qrToken.codigo}&firma=${encodeURIComponent(qrToken.firma)}`);

    expect(verifRes.status).toBe(200);
    expect(verifRes.data.valido).toBe(true);
    expect(verifRes.data.categoria).toBe('Plástico');
    expect(verifRes.data.puntos).toBe(10);
  });

  // Combo 2.2: Multiple Material Types Produce Distinct Correct Point Allocations
  suite.it('Combo 2.2: Classification across different materials (Papel, Metal) issues corresponding point rates', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;

    // Papel
    const papelRes = await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': station.provisioningToken },
      body: { categoria: 'Papel', confianza: 0.99, stationId: station.id },
    });
    const verifPapel = await harness.request('GET', `/api/v1/qr/verificar?codigo=${papelRes.data.qr.codigo}`);
    expect(verifPapel.data.puntos).toBe(5);

    // Metal
    const metalRes = await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': station.provisioningToken },
      body: { categoria: 'Metal', confianza: 0.94, stationId: station.id },
    });
    const verifMetal = await harness.request('GET', `/api/v1/qr/verificar?codigo=${metalRes.data.qr.codigo}`);
    expect(verifMetal.data.puntos).toBe(15);
  });

  // Combo 2.3: AI Diagnostics Feed Records Ingested Event and Reflects in Admin Dashboard
  suite.it('Combo 2.3: Ingested classification events appear in GET /clasificacion history with confidence metrics', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;
    const adminLogin = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });

    await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': station.provisioningToken },
      body: { categoria: 'Vidrio', confianza: 0.97, stationId: station.id },
    });

    const feedRes = await harness.request('GET', '/api/v1/clasificacion?page=1&limit=20', { cookies: adminLogin.cookies });
    expect(feedRes.status).toBe(200);
    const vidrioEvt = feedRes.data.data.find((e: any) => e.categoria === 'Vidrio');
    expect(vidrioEvt).toBeDefined();
    expect(vidrioEvt.confianza).toBe(0.97);
  });

  // Combo 2.4: Cryptographic TTL and Timestamp Validation across Pipeline
  suite.it('Combo 2.4: Generated QR payload from classification retains 10-minute validity window for client claim', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;

    const classRes = await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': station.provisioningToken },
      body: { categoria: 'Plástico', confianza: 0.95, stationId: station.id },
    });

    const qr = classRes.data.qr;
    const expiresAt = new Date(qr.expiresAt).getTime();
    const now = Date.now();
    const diffMinutes = (expiresAt - now) / (60 * 1000);

    expect(diffMinutes).toBeGreaterThanOrEqual(9.9);
    expect(diffMinutes).toBeLessThanOrEqual(10.1);
  });
}
