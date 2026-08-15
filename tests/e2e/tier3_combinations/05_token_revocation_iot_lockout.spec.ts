/**
 * Tier 3: Cross-Feature Combinations - Token Revocation & IoT Ingestion Lockout
 * Flow: Admin revokes token -> Station telemetry fails 401 -> Station pings with new token -> Telemetry succeeds.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { createNormalTelemetryPayload } from '../fixtures/telemetry.fixture';

export function registerTokenRevocationIotLockoutTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Token Revocation & IoT Lockout Sync', 'Tier 3');

  suite.beforeEach(() => {
    harness.reset();
  });

  // Combo 5.1: Admin Revocation Blocks Telemetry on Old Token
  suite.it('Combo 5.1: Admin revokes station token -> Old token telemetry rejected with 401', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;
    const oldToken = station.provisioningToken;

    // Verify initial telemetry works with old token
    const initialRes = await harness.request('POST', '/api/v1/iot/telemetria', {
      body: createNormalTelemetryPayload(station.macAddress, oldToken),
    });
    expect(initialRes.status).toBe(200);

    // Admin revokes token
    const revokeRes = await harness.request('POST', `/api/v1/estaciones/${station.id}/revoke-token`, {
      cookies: { access_token: 'mock-jwt-admin@recicla.com-ADMIN' },
    });
    expect(revokeRes.status).toBe(200);
    const newToken = revokeRes.data.newToken;
    expect(newToken !== oldToken).toBeTruthy();

    // Telemetry with old token must now fail with 401
    const blockedRes = await harness.request('POST', '/api/v1/iot/telemetria', {
      body: createNormalTelemetryPayload(station.macAddress, oldToken),
    });
    expect(blockedRes.status).toBe(401);
  });

  // Combo 5.2: Station Recovers Ingestion with Newly Issued Token
  suite.it('Combo 5.2: Station updates firmware with new token and successfully resumes telemetry ingestion', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;

    // Revoke token
    const revokeRes = await harness.request('POST', `/api/v1/estaciones/${station.id}/revoke-token`, {
      cookies: { access_token: 'mock-jwt-admin@recicla.com-ADMIN' },
    });
    const newToken = revokeRes.data.newToken;

    // Telemetry with new token succeeds
    const successRes = await harness.request('POST', '/api/v1/iot/telemetria', {
      body: createNormalTelemetryPayload(station.macAddress, newToken),
    });

    expect(successRes.status).toBe(200);
    expect(successRes.data.recorded).toBe(true);
  });
}
