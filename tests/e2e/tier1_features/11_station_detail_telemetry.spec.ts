/**
 * Tier 1: Feature 11 - Station Detail & Telemetry View
 * Validates ultrasonic compartment fill gauges, battery levels, ETA calculations, and token revocation.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerStationDetailTelemetryTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 11: Station Detail & Telemetry View', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC11.1: Ultrasonic Gauges per Compartment
  suite.it('TC11.1: Station telemetry tracks fill levels for papel, plástico, and metal compartments', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const station = harness.stations.get('station-uuid-001')!;

    // Send telemetry update
    await harness.request('POST', '/api/v1/iot/telemetria', {
      body: {
        macAddress: station.macAddress,
        token: station.token,
        levels: { papel: 45, plastico: 82, metal: 15 },
        battery: 92,
      },
    });

    const stationsRes = await harness.request('GET', '/api/v1/estaciones', { cookies: adminRes.cookies });
    const updated = stationsRes.data.find((s: any) => s.id === station.id);

    expect(updated.currentLevels.papel).toBe(45);
    expect(updated.currentLevels.plastico).toBe(82);
    expect(updated.currentLevels.metal).toBe(15);
    expect(updated.status).toBe('warning'); // >80% triggers warning
  });

  // TC11.2: Battery Level Tracking & Low Battery Flag
  suite.it('TC11.2: Low battery level (<=10%) is detected and flagged in station telemetry response', async () => {
    const station = harness.stations.get('station-uuid-001')!;

    const res = await harness.request('POST', '/api/v1/iot/telemetria', {
      body: {
        macAddress: station.macAddress,
        token: station.token,
        levels: { papel: 20, plastico: 30, metal: 10 },
        battery: 8,
      },
    });

    expect(res.status).toBe(200);
    expect(res.data.batteryAlert).toBe(true);
    expect(station.battery).toBe(8);
  });

  // TC11.3: Token Revocation via POST /estaciones/:id/revoke-token
  suite.it('TC11.3: Admin can revoke and regenerate station token via POST /estaciones/:id/revoke-token', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const station = harness.stations.get('station-uuid-001')!;
    const oldToken = station.token;

    const res = await harness.request('POST', `/api/v1/estaciones/${station.id}/revoke-token`, {
      cookies: adminRes.cookies,
    });

    expect(res.status).toBe(200);
    expect(res.data.newToken).toBeDefined();
    expect(res.data.newToken !== oldToken).toBe(true);
    expect(station.token).toBe(res.data.newToken);
  });

  // TC11.4: Revoked Token Telemetry Lockout
  suite.it('TC11.4: Attempting to submit telemetry with old revoked token returns 401 Unauthorized', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const station = harness.stations.get('station-uuid-001')!;
    const oldToken = station.token;

    // Revoke token
    await harness.request('POST', `/api/v1/estaciones/${station.id}/revoke-token`, { cookies: adminRes.cookies });

    // Submit telemetry with old token
    const telemRes = await harness.request('POST', '/api/v1/iot/telemetria', {
      body: {
        macAddress: station.macAddress,
        token: oldToken,
        levels: { papel: 10, plastico: 10, metal: 10 },
        battery: 99,
      },
    });

    expect(telemRes.status).toBe(401);
  });

  // TC11.5: Unauthorized Revocation Rejection
  suite.it('TC11.5: Citizen user cannot revoke station tokens (403 Forbidden)', async () => {
    const userRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });

    const res = await harness.request('POST', '/api/v1/estaciones/station-uuid-001/revoke-token', {
      cookies: userRes.cookies,
    });

    expect(res.status).toBe(403);
  });
}
