/**
 * Tier 2: Boundary & Corner Cases - IoT Telemetry & Sensor Overflows
 * Validates sensor overflows (>100%), negative sensor noise, threshold edge values (79% vs 80%).
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import {
  createOverflowTelemetryPayload,
  createNegativeTelemetryPayload,
  createCriticalBatteryTelemetryPayload,
} from '../fixtures/telemetry.fixture';

export function registerTelemetryOverflowBoundaryTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('IoT Telemetry & Overflow Constraints', 'Tier 2');

  suite.beforeEach(() => {
    harness.reset();
  });

  // BC5.1: Capacity Overflow (> 100% e.g. 120%) Handled Safely
  suite.it('BC5.1: Telemetry readings over 100% capacity are clamped to 100% and flag WARNING status', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;
    const payload = createOverflowTelemetryPayload(station.macAddress, station.provisioningToken);

    const res = await harness.request('POST', '/api/v1/iot/telemetria', { body: payload });

    expect(res.status).toBe(200);
    expect(res.data.stationStatus).toBe('WARNING');

    const dbStation = harness.stations.get(station.id);
    expect(dbStation?.currentLevels?.plastico).toBe(100);
    expect(dbStation?.currentLevels?.papel).toBe(100);
  });

  // BC5.2: Negative Sensor Noise Rejection -> 400 Bad Request
  suite.it('BC5.2: Negative ultrasonic distance readings are rejected with 400 Bad Request', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;
    const payload = createNegativeTelemetryPayload(station.macAddress, station.provisioningToken);

    const res = await harness.request('POST', '/api/v1/iot/telemetria', { body: payload });

    expect(res.status).toBe(400);
    expect(res.data.message).toContain('Negative sensor readings rejected');
  });

  // BC5.3: Boundary Threshold Precision (79% vs 80%)
  suite.it('BC5.3: Fill level at 79% retains ACTIVE status, while 80% triggers WARNING status', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;

    // Test 79% (Below threshold)
    const payload79 = {
      macAddress: station.macAddress,
      token: station.provisioningToken,
      levels: { papel: 79, plastico: 50, metal: 30 },
      battery: 90,
    };
    const res79 = await harness.request('POST', '/api/v1/iot/telemetria', { body: payload79 });
    expect(res79.status).toBe(200);
    expect(res79.data.stationStatus).toBe('ACTIVE');

    // Test 80% (Threshold reached)
    const payload80 = {
      macAddress: station.macAddress,
      token: station.provisioningToken,
      levels: { papel: 80, plastico: 50, metal: 30 },
      battery: 90,
    };
    const res80 = await harness.request('POST', '/api/v1/iot/telemetria', { body: payload80 });
    expect(res80.status).toBe(200);
    expect(res80.data.stationStatus).toBe('WARNING');
  });

  // BC5.4: Unauthorized Station Ingestion Attempt -> 401 Unauthorized
  suite.it('BC5.4: Telemetry payload submitted with wrong station token returns 401 Unauthorized', async () => {
    const payload = {
      macAddress: 'AA:BB:CC:11:22:33',
      token: 'INVALID-STATION-TOKEN-666',
      levels: { papel: 20, plastico: 30, metal: 10 },
      battery: 80,
    };

    const res = await harness.request('POST', '/api/v1/iot/telemetria', { body: payload });
    expect(res.status).toBe(401);
    expect(res.data.message).toContain('Unauthorized IoT telemetry source');
  });

  // BC5.5: Critical Battery Drain Flag
  suite.it('BC5.5: Battery level drop below 10% returns batteryAlert: true in response body', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;
    const payload = createCriticalBatteryTelemetryPayload(station.macAddress, station.provisioningToken);

    const res = await harness.request('POST', '/api/v1/iot/telemetria', { body: payload });
    expect(res.status).toBe(200);
    expect(res.data.batteryAlert).toBe(true);
  });
}
