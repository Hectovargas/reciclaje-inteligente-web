/**
 * Tier 1: Feature Coverage - Smart Recycling Stations Management
 * Validates R1 requirements & F3: Station creation, listing, updating, and token lifecycle.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidStationPayload } from '../fixtures/station.fixture';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerStationTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Estaciones Management (F3 / R1)', 'Tier 1');

  suite.beforeEach(async () => {
    harness.reset();
    // Default session: login as ADMIN
    await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
  });

  // TC3.1: Create Station
  suite.it('TC3.1: Admin can create station with MAC address -> status defaults to PENDING_ACTIVATION', async () => {
    const payload = createValidStationPayload('zone-uuid-downtown-01', {
      name: 'Estación Bulevar Costero',
      location: 'Bulevar Costero #45',
      macAddress: 'AA:BB:CC:DD:EE:01',
    });
    const res = await harness.request('POST', '/api/v1/estaciones', { body: payload });

    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    expect(res.data.name).toBe('Estación Bulevar Costero');
    expect(res.data.status).toBe('PENDING_ACTIVATION');
    expect(res.data.token).toBeDefined();
  });

  // TC3.2: List Stations
  suite.it('TC3.2: GET /estaciones retrieves all stations with normalized status strings', async () => {
    const res = await harness.request('GET', '/api/v1/estaciones');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBeTruthy();
    expect(res.data.length).toBeGreaterThanOrEqual(2);
    expect(res.data.some((s: any) => s.status === 'active')).toBeTruthy();
  });

  // TC3.3: Station Creation without MAC address
  suite.it('TC3.3: Create station without macAddress defaults status directly to ACTIVE', async () => {
    const payload = createValidStationPayload('zone-uuid-downtown-01', {
      name: 'Estación Fija Biblioteca Central',
      location: 'Calle Real #10',
      macAddress: undefined,
    });
    const res = await harness.request('POST', '/api/v1/estaciones', { body: payload });

    expect(res.status).toBe(201);
    expect(res.data.status).toBe('ACTIVE');
  });

  // TC3.4: Provisioning Token Revocation
  suite.it('TC3.4: Admin can revoke and regenerate station provisioning token', async () => {
    const stationId = 'station-uuid-001';
    const oldStation = harness.stations.get(stationId);
    const oldToken = oldStation?.token;

    const res = await harness.request('POST', `/api/v1/estaciones/${stationId}/revoke-token`);

    expect(res.status).toBe(200);
    expect(res.data.stationId).toBe(stationId);
    expect(res.data.newToken).toBeDefined();
    expect(res.data.newToken !== oldToken).toBeTruthy();
  });

  // TC3.5: Station Capacity and Location Persistence
  suite.it('TC3.5: Created station correctly persists capacity threshold and location data', async () => {
    const payload = createValidStationPayload('zone-uuid-downtown-01', {
      name: 'Estación Alta Capacidad Campus Universitario',
      capacity: 500,
      location: 'Campus Central, Edificio Innovación',
    });
    const res = await harness.request('POST', '/api/v1/estaciones', { body: payload });

    expect(res.status).toBe(201);
    expect(res.data.capacity).toBe(500);
    expect(res.data.location).toBe('Campus Central, Edificio Innovación');
  });
}
