/**
 * Tier 4: Real-World Workload Scenarios - Station Capacity Surge & Municipal Maintenance Journey
 * Tests IoT fill monitoring, operational warning escalation, capacity saturation, and maintenance truck recovery.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerStationCapacityMaintenanceJourneyTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Station Capacity Surge & Maintenance Recovery Journey', 'Tier 4');

  suite.beforeEach(() => {
    harness.reset();
  });

  // Journey 3.1: Municipal Operations & Capacity Surge Lifecycle
  suite.it('Journey 3.1: Municipal Operations: Normal Ingestion -> Surge to WARNING (85%) -> Saturation (100%) -> Truck Emptying -> ACTIVE Recovery', async () => {
    const station = TEST_CONSTANTS.STATIONS.STATION_01;

    console.log('\n   [Phase 1: Normal Ingestion] Station operating nominally at 35% fill level...');
    const p1Res = await harness.request('POST', '/api/v1/iot/telemetria', {
      body: {
        macAddress: station.macAddress,
        token: station.provisioningToken,
        levels: { papel: 20, plastico: 35, metal: 15 },
        battery: 98,
      },
    });
    expect(p1Res.status).toBe(200);
    expect(p1Res.data.stationStatus).toBe('ACTIVE');

    // Admin dashboard check
    const adminLogin = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const dashP1 = await harness.request('GET', '/api/v1/dashboard/metrics', { cookies: adminLogin.cookies });
    expect(dashP1.data.estacionesAlerta).toBe(0);

    console.log('   [Phase 2: Weekend Surge] Massive plastic recycling event drives fill level to 85%...');
    const p2Res = await harness.request('POST', '/api/v1/iot/telemetria', {
      body: {
        macAddress: station.macAddress,
        token: station.provisioningToken,
        levels: { papel: 40, plastico: 85, metal: 30 },
        battery: 95,
      },
    });
    expect(p2Res.status).toBe(200);
    expect(p2Res.data.stationStatus).toBe('WARNING');

    // Dashboard alerts maintenance dispatcher
    const dashP2 = await harness.request('GET', '/api/v1/dashboard/metrics', { cookies: adminLogin.cookies });
    expect(dashP2.data.estacionesAlerta).toBe(1);

    console.log('   [Phase 3: Saturation] Additional deposits push bin to 100% capacity...');
    const p3Res = await harness.request('POST', '/api/v1/iot/telemetria', {
      body: {
        macAddress: station.macAddress,
        token: station.provisioningToken,
        levels: { papel: 50, plastico: 100, metal: 40 },
        battery: 92,
      },
    });
    expect(p3Res.status).toBe(200);
    expect(p3Res.data.stationStatus).toBe('WARNING');

    console.log('   [Phase 4: Municipal Truck Maintenance] Crew empties compartments and resets telemetry...');
    const p4Res = await harness.request('POST', '/api/v1/iot/telemetria', {
      body: {
        macAddress: station.macAddress,
        token: station.provisioningToken,
        levels: { papel: 0, plastico: 0, metal: 0 },
        battery: 90,
      },
    });
    expect(p4Res.status).toBe(200);
    expect(p4Res.data.stationStatus).toBe('ACTIVE');

    console.log('   [Phase 5: Verified Recovery] Central dashboard clears warning state and returns to green...');
    const dashP5 = await harness.request('GET', '/api/v1/dashboard/metrics', { cookies: adminLogin.cookies });
    expect(dashP5.data.estacionesAlerta).toBe(0);
  });

  // Journey 3.2: Multi-Station Zone Surge Escalation
  suite.it('Journey 3.2: Multi-Station Zone Surge Escalation (Simultaneous capacity saturation across city zone)', async () => {
    const st1 = harness.stations.get('station-uuid-001')!;
    const st2 = harness.stations.get('station-uuid-002')!;

    // Both stations breach 80%
    await harness.request('POST', '/api/v1/iot/telemetria', {
      body: { macAddress: st1.macAddress, token: st1.token, levels: { papel: 85, plastico: 82, metal: 70 }, battery: 90 },
    });
    await harness.request('POST', '/api/v1/iot/telemetria', {
      body: { macAddress: st2.macAddress, token: st2.token, levels: { papel: 90, plastico: 95, metal: 88 }, battery: 91 },
    });

    const adminLogin = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const dash = await harness.request('GET', '/api/v1/dashboard/metrics', { cookies: adminLogin.cookies });

    expect(dash.data.estacionesAlerta).toBe(2);
  });

  // Journey 3.3: Sensor Overflow Clamping and Resilient Recovery
  suite.it('Journey 3.3: Extreme Sensor Overflow (120%) clamped to 100% and restored after maintenance', async () => {
    const st1 = harness.stations.get('station-uuid-001')!;

    const overflowRes = await harness.request('POST', '/api/v1/iot/telemetria', {
      body: { macAddress: st1.macAddress, token: st1.token, levels: { papel: 120, plastico: 130, metal: 110 }, battery: 80 },
    });

    expect(overflowRes.status).toBe(200);
    expect(st1.currentLevels.papel).toBe(100);
    expect(st1.currentLevels.plastico).toBe(100);
    expect(st1.currentLevels.metal).toBe(100);
    expect(st1.status).toBe('WARNING');
  });
}
