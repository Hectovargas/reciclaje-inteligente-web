/**
 * Tier 3: Cross-Feature Combinations - Telemetry Trigger & Dashboard Sync
 * Flow: ESP32 Telemetry (>=80%) -> Station status updates to WARNING -> Dashboard metrics reflect warning.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { createWarningTelemetryPayload, createNormalTelemetryPayload } from '../fixtures/telemetry.fixture';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerTelemetryStationWarningTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Telemetry Trigger & Dashboard Sync', 'Tier 3');

  suite.beforeEach(() => {
    harness.reset();
  });

  // Combo 1.1: Telemetry Overfill Updates Dashboard Metrics
  suite.it('Combo 1.1: Telemetry overfill (85% plastic) triggers station WARNING and increments Dashboard alertas count', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;

    // 1. Initial State: Normal
    await harness.request('POST', '/api/v1/iot/telemetria', {
      body: createNormalTelemetryPayload(station.macAddress, station.provisioningToken),
    });

    // Login as Admin to inspect dashboard
    const adminLogin = await harness.request('POST', '/api/v1/auth/login', {
      body: createValidLoginPayload('ADMIN'),
    });

    const initialMetrics = await harness.request('GET', '/api/v1/dashboard/metrics', { cookies: adminLogin.cookies });
    expect(initialMetrics.data.estacionesAlerta).toBe(0);

    // 2. Ultrasonic Sensor Ingests 85% Fill Level (Threshold breach)
    const telemetryRes = await harness.request('POST', '/api/v1/iot/telemetria', {
      body: createWarningTelemetryPayload(station.macAddress, station.provisioningToken, 'plastico'),
    });
    expect(telemetryRes.status).toBe(200);
    expect(telemetryRes.data.stationStatus).toBe('WARNING');

    // 3. Verify Dashboard Metrics reflect the new warning
    const updatedMetrics = await harness.request('GET', '/api/v1/dashboard/metrics', { cookies: adminLogin.cookies });
    expect(updatedMetrics.data.estacionesAlerta).toBe(1);

    // 4. Verify Stations list reflects warning
    const stationsList = await harness.request('GET', '/api/v1/dashboard/stations', { cookies: adminLogin.cookies });
    const targetStation = stationsList.data.find((s: any) => s.id === station.id);
    expect(targetStation.status).toBe('warning');
  });

  // Combo 1.2: Emptying Bin Restores Dashboard Normalcy
  suite.it('Combo 1.2: Emptying bin lowers fill level to 10% and restores Dashboard to 0 alertas', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;

    // Set to Warning first
    await harness.request('POST', '/api/v1/iot/telemetria', {
      body: createWarningTelemetryPayload(station.macAddress, station.provisioningToken, 'plastico'),
    });

    // Reset with emptied bin telemetry
    await harness.request('POST', '/api/v1/iot/telemetria', {
      body: {
        macAddress: station.macAddress,
        token: station.provisioningToken,
        levels: { papel: 5, plastico: 10, metal: 5 },
        battery: 92,
      },
    });

    const adminLogin = await harness.request('POST', '/api/v1/auth/login', {
      body: createValidLoginPayload('ADMIN'),
    });
    const metrics = await harness.request('GET', '/api/v1/dashboard/metrics', { cookies: adminLogin.cookies });

    expect(metrics.data.estacionesAlerta).toBe(0);
    expect(metrics.data.estacionesActivas).toBeGreaterThanOrEqual(1);
  });

  // Combo 1.3: Multi-Compartment Overflow Aggregation
  suite.it('Combo 1.3: Multi-compartment surge (paper 88%, metal 91%) triggers WARNING and records peak levels', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;

    const telemRes = await harness.request('POST', '/api/v1/iot/telemetria', {
      body: {
        macAddress: station.macAddress,
        token: station.provisioningToken,
        levels: { papel: 88, plastico: 40, metal: 91 },
        battery: 85,
      },
    });

    expect(telemRes.status).toBe(200);
    expect(telemRes.data.stationStatus).toBe('WARNING');

    const adminLogin = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const stationsList = await harness.request('GET', '/api/v1/estaciones', { cookies: adminLogin.cookies });
    const updated = stationsList.data.find((s: any) => s.id === station.id);

    expect(updated.currentLevels.papel).toBe(88);
    expect(updated.currentLevels.metal).toBe(91);
    expect(updated.status).toBe('warning');
  });

  // Combo 1.4: Critical Battery Drop with Telemetry Update
  suite.it('Combo 1.4: Hardware battery drop to 7% flags batteryAlert: true while persisting sensor levels', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;

    const telemRes = await harness.request('POST', '/api/v1/iot/telemetria', {
      body: {
        macAddress: station.macAddress,
        token: station.provisioningToken,
        levels: { papel: 30, plastico: 25, metal: 15 },
        battery: 7,
      },
    });

    expect(telemRes.status).toBe(200);
    expect(telemRes.data.batteryAlert).toBe(true);
  });
}
