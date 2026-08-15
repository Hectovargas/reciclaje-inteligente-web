/**
 * Tier 1: Feature Coverage - ESP32 Zero-Touch Activation
 * Validates R1 & R5 (F10): Zero-touch activation by MAC address and provisioning token.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { createValidActivationPayload } from '../fixtures/station.fixture';

export function registerEsp32ActivationTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('ESP32 Zero-Touch Provisioning (F10 / R1, R5)', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC4.1: First-time Ping Activation
  suite.it('TC4.1: First ping with valid MAC and token activates PENDING_ACTIVATION station to ACTIVE', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_PENDING;
    const payload = createValidActivationPayload(station.macAddress, station.provisioningToken);

    const res = await harness.request('POST', '/api/v1/estaciones/activar', { body: payload });

    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ACTIVE');
    expect(res.data.stationId).toBe(station.id);
    expect(res.data.message).toContain('successfully activated');

    // Confirm state updated in database
    const updatedStation = harness.stations.get(station.id);
    expect(updatedStation?.status).toBe('ACTIVE');
  });

  // TC4.2: Activation via /api/v1/iot/ping Endpoint Alias
  suite.it('TC4.2: Alternative endpoint POST /api/v1/iot/ping activates station identically', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_PENDING;
    const payload = createValidActivationPayload(station.macAddress, station.provisioningToken);

    const res = await harness.request('POST', '/api/v1/iot/ping', { body: payload });

    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ACTIVE');
  });

  // TC4.3: Station Information in Activation Response
  suite.it('TC4.3: Activation response returns station metadata (name, stationId, status)', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_PENDING;
    const payload = createValidActivationPayload(station.macAddress, station.provisioningToken);

    const res = await harness.request('POST', '/api/v1/estaciones/activar', { body: payload });

    expect(res.data.name).toBe(station.name);
    expect(res.data.stationId).toBe(station.id);
  });

  // TC4.4: Subsequent Pings on Already Active Station
  suite.it('TC4.4: Subsequent activation pings from an already active station succeed without error', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01; // already ACTIVE
    const payload = createValidActivationPayload(station.macAddress, station.provisioningToken);

    const res = await harness.request('POST', '/api/v1/estaciones/activar', { body: payload });

    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ACTIVE');
  });

  // TC4.5: Case-Insensitive MAC Address Handling
  suite.it('TC4.5: Activation handles lowercase or uppercase MAC address formatting seamlessly', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_PENDING;
    const lowerMac = station.macAddress.toLowerCase();
    const payload = createValidActivationPayload(lowerMac, station.provisioningToken);

    const res = await harness.request('POST', '/api/v1/estaciones/activar', { body: payload });

    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ACTIVE');
  });
}
