/**
 * Tier 1: Feature Coverage - IoT Ultrasonic Telemetry Ingestion
 * Validates R5 (F11) requirements: Ultrasonic fill level readings, threshold transitions, battery alerts.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { createNormalTelemetryPayload, createWarningTelemetryPayload, createCriticalBatteryTelemetryPayload } from '../fixtures/telemetry.fixture';

export function registerIoTTelemetryTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('IoT Ultrasonic Telemetry (F11 / R5)', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC6.1: Ingest Normal Telemetry
  suite.it('TC6.1: Ingest normal fill level telemetry (<80%) maintains station in ACTIVE status', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;
    const payload = createNormalTelemetryPayload(station.macAddress, station.provisioningToken);

    const res = await harness.request('POST', '/api/v1/iot/telemetria', { body: payload });

    expect(res.status).toBe(200);
    expect(res.data.recorded).toBe(true);
    expect(res.data.stationStatus).toBe('ACTIVE');
    expect(res.data.batteryAlert).toBe(false);

    const dbStation = harness.stations.get(station.id);
    expect(dbStation?.status).toBe('ACTIVE');
  });

  // TC6.2: Auto-Transition to WARNING on >= 80% Fill
  suite.it('TC6.2: Telemetry reading with fill level >= 80% automatically transitions station status to WARNING', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;
    const payload = createWarningTelemetryPayload(station.macAddress, station.provisioningToken, 'plastico');

    const res = await harness.request('POST', '/api/v1/iot/telemetria', { body: payload });

    expect(res.status).toBe(200);
    expect(res.data.recorded).toBe(true);
    expect(res.data.stationStatus).toBe('WARNING');

    const dbStation = harness.stations.get(station.id);
    expect(dbStation?.status).toBe('WARNING');
  });

  // TC6.3: Multi-Compartment Separate Tracking
  suite.it('TC6.3: Telemetry properly stores separate fill levels for papel, plastico, and metal', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;
    const payload = {
      macAddress: station.macAddress,
      token: station.provisioningToken,
      levels: { papel: 45, plastico: 60, metal: 15 },
      battery: 90,
    };

    const res = await harness.request('POST', '/api/v1/iot/telemetria', { body: payload });

    expect(res.status).toBe(200);
    const dbStation = harness.stations.get(station.id);
    expect(dbStation?.currentLevels?.papel).toBe(45);
    expect(dbStation?.currentLevels?.plastico).toBe(60);
    expect(dbStation?.currentLevels?.metal).toBe(15);
  });

  // TC6.4: Critical Battery Alert Flag
  suite.it('TC6.4: Telemetry with battery <= 10% flags batteryAlert in response', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;
    const payload = createCriticalBatteryTelemetryPayload(station.macAddress, station.provisioningToken);

    const res = await harness.request('POST', '/api/v1/iot/telemetria', { body: payload });

    expect(res.status).toBe(200);
    expect(res.data.batteryAlert).toBe(true);
    const dbStation = harness.stations.get(station.id);
    expect(dbStation?.battery).toBe(5);
  });

  // TC6.5: Recovery to ACTIVE when levels fall below 80%
  suite.it('TC6.5: Subsequent telemetry after bin emptying (<80%) resets station status from WARNING back to ACTIVE', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;

    // First: fill to warning
    await harness.request('POST', '/api/v1/iot/telemetria', {
      body: createWarningTelemetryPayload(station.macAddress, station.provisioningToken, 'metal'),
    });
    expect(harness.stations.get(station.id)?.status).toBe('WARNING');

    // Second: emptied
    const emptiedPayload = {
      macAddress: station.macAddress,
      token: station.provisioningToken,
      levels: { papel: 5, plastico: 10, metal: 2 },
      battery: 85,
    };
    const res = await harness.request('POST', '/api/v1/iot/telemetria', { body: emptiedPayload });

    expect(res.status).toBe(200);
    expect(res.data.stationStatus).toBe('ACTIVE');
    expect(harness.stations.get(station.id)?.status).toBe('ACTIVE');
  });
}
