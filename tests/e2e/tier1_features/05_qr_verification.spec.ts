/**
 * Tier 1: Feature Coverage - Cryptographic QR Generation & Verification
 * Validates R5 (F12) requirements: Keccak256/ECDSA signatures, TTL, verification.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { verifyEcdsaSignature } from '../fixtures/qr.fixture';

export function registerQrVerificationTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Cryptographic QR Engine (F12 / R5)', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC5.1: Generate QR with Valid Station Token Guard
  suite.it('TC5.1: Station with valid token generates ECDSA-signed QR payload', async () => {
    const stationToken = TEST_CONSTANTS.STATIONS.STATION_01.provisioningToken;
    const res = await harness.request('POST', '/api/v1/qr/generar', {
      headers: { 'x-station-token': stationToken },
      body: { categoria: 'Plástico' },
    });

    expect(res.status).toBe(201);
    expect(res.data.codigo).toBeDefined();
    expect(res.data.codigo.startsWith('QR-PLÁSTICO-')).toBeTruthy();
    expect(res.data.firma).toBeDefined();
    expect(res.data.firma.startsWith('0x')).toBeTruthy();
    expect(res.data.usado).toBe(false);
    expect(res.data.expiresAt).toBeDefined();
  });

  // TC5.2: Cryptographic Signature Verification
  suite.it('TC5.2: Generated signature matches Keccak256 message hash signed by Admin private key', async () => {
    const stationToken = TEST_CONSTANTS.STATIONS.STATION_01.provisioningToken;
    const genRes = await harness.request('POST', '/api/v1/qr/generar', {
      headers: { 'x-station-token': stationToken },
      body: { categoria: 'Metal' },
    });

    const { codigo, categoria, timestamp, firma } = genRes.data;

    // Independent cryptographic verification
    const isValid = verifyEcdsaSignature(
      codigo,
      categoria,
      timestamp,
      firma,
      TEST_CONSTANTS.ADMIN_ADDRESS
    );
    expect(isValid).toBe(true);
  });

  // TC5.3: GET /qr/verificar Validates Signature
  suite.it('TC5.3: GET /qr/verificar returns valid: true and reward points for unexpired QR', async () => {
    const stationToken = TEST_CONSTANTS.STATIONS.STATION_01.provisioningToken;
    const genRes = await harness.request('POST', '/api/v1/qr/generar', {
      headers: { 'x-station-token': stationToken },
      body: { categoria: 'Plástico' },
    });

    const { codigo, firma } = genRes.data;

    const verifRes = await harness.request('GET', `/api/v1/qr/verificar?codigo=${codigo}&firma=${encodeURIComponent(firma)}`);

    expect(verifRes.status).toBe(200);
    expect(verifRes.data.valido).toBe(true);
    expect(verifRes.data.categoria).toBe('Plástico');
    expect(verifRes.data.puntos).toBe(10);
  });

  // TC5.4: QR Generation via Classification Event
  suite.it('TC5.4: POST /clasificacion generates and embeds valid QR token directly in event response', async () => {
    const stationToken = TEST_CONSTANTS.STATIONS.STATION_01.provisioningToken;
    const res = await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': stationToken },
      body: {
        categoria: 'Papel',
        confianza: 0.98,
        stationId: TEST_CONSTANTS.STATIONS.STATION_01.id,
      },
    });

    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    expect(res.data.categoria).toBe('Papel');
    expect(res.data.qr).toBeDefined();
    expect(res.data.qr.codigo).toBeDefined();
    expect(res.data.qr.firma).toBeDefined();
  });

  // TC5.5: QR 10-Minute TTL Window
  suite.it('TC5.5: Generated QR expiresAt timestamp is approximately 10 minutes in the future', async () => {
    const stationToken = TEST_CONSTANTS.STATIONS.STATION_01.provisioningToken;
    const res = await harness.request('POST', '/api/v1/qr/generar', {
      headers: { 'x-station-token': stationToken },
      body: { categoria: 'Vidrio' },
    });

    const now = Date.now();
    const expiresTime = new Date(res.data.expiresAt).getTime();
    const diffMinutes = (expiresTime - now) / (60 * 1000);

    expect(diffMinutes).toBeGreaterThanOrEqual(9.9);
    expect(diffMinutes).toBeLessThanOrEqual(10.1);
  });
}
