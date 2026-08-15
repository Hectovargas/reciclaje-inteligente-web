/**
 * Tier 2: Boundary & Corner Cases - ESP32 Activation Boundaries
 * Validates malformed MACs, wrong tokens, revoked tokens, decommissioned station activation.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { createValidActivationPayload } from '../fixtures/station.fixture';

export function registerEsp32ActivationBoundaryTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('ESP32 Activation Boundary Constraints', 'Tier 2');

  suite.beforeEach(() => {
    harness.reset();
  });

  // BC3.1: Malformed MAC Address
  suite.it('BC3.1: Activation with malformed MAC format returns 400 Bad Request', async () => {
    const res = await harness.request('POST', '/api/v1/estaciones/activar', {
      body: { macAddress: 'invalid-mac-address', provisioningToken: 'PROV-123' },
    });
    expect(res.status).toBe(400);
    expect(res.data.message).toContain('Malformed MAC');
  });

  // BC3.2: Mismatched Provisioning Token -> 401 Unauthorized
  suite.it('BC3.2: Activation with valid MAC but wrong provisioning token returns 401 Unauthorized', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_PENDING;
    const payload = createValidActivationPayload(station.macAddress, 'WRONG-TOKEN-999');

    const res = await harness.request('POST', '/api/v1/estaciones/activar', { body: payload });
    expect(res.status).toBe(401);
    expect(res.data.message).toContain('Invalid station credentials');
  });

  // BC3.3: Activation Attempt on Decommissioned / OFFLINE Station -> 400
  suite.it('BC3.3: Activation attempt on OFFLINE/decommissioned station returns 400 Bad Request', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_PENDING;
    const dbStation = harness.stations.get(station.id);
    if (dbStation) dbStation.status = 'OFFLINE';

    const payload = createValidActivationPayload(station.macAddress, station.provisioningToken);
    const res = await harness.request('POST', '/api/v1/estaciones/activar', { body: payload });

    expect(res.status).toBe(400);
    expect(res.data.message).toContain('Cannot activate decommissioned');
  });

  // BC3.4: Revoked Token Activation Attempt -> 401 Unauthorized
  suite.it('BC3.4: Activation using old revoked provisioning token after admin reset returns 401', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_PENDING;
    const originalToken = station.provisioningToken;

    // Admin revokes token
    await harness.request('POST', `/api/v1/estaciones/${station.id}/revoke-token`, {
      cookies: { access_token: 'mock-jwt-admin@recicla.com-ADMIN' },
    });

    // Old token attempt
    const res = await harness.request('POST', '/api/v1/estaciones/activar', {
      body: { macAddress: station.macAddress, provisioningToken: originalToken },
    });

    expect(res.status).toBe(401);
  });

  // BC3.5: Missing Required Fields in Activation Payload -> 400
  suite.it('BC3.5: Activation request with missing MAC or missing token returns 400 Bad Request', async () => {
    const res1 = await harness.request('POST', '/api/v1/estaciones/activar', { body: { macAddress: 'AA:BB:CC:DD:EE:FF' } });
    expect(res1.status).toBe(400);

    const res2 = await harness.request('POST', '/api/v1/estaciones/activar', { body: { provisioningToken: 'TOK-123' } });
    expect(res2.status).toBe(400);
  });
}
