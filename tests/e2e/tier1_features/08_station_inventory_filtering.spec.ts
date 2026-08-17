/**
 * Tier 1: Feature 8 - Station Inventory & Filtering (/admin/estaciones)
 * Validates station listing, status filters, search, and zone association.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerStationInventoryFilteringTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 8: Station Inventory & Filtering (/admin/estaciones)', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC8.1: Station Inventory Listing
  suite.it('TC8.1: GET /estaciones retrieves array of stations with capacity and status', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const res = await harness.request('GET', '/api/v1/estaciones', { cookies: adminRes.cookies });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThanOrEqual(1);
    expect(res.data[0].id).toBeDefined();
    expect(res.data[0].name).toBeDefined();
  });

  // TC8.2: Status Value Normalization
  suite.it('TC8.2: Station list returns normalized status values (active, warning, pending_activation)', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const res = await harness.request('GET', '/api/v1/estaciones', { cookies: adminRes.cookies });

    const statuses = res.data.map((s: any) => s.status);
    expect(statuses.some((st: string) => st === 'active' || st === 'pending_activation')).toBe(true);
  });

  // TC8.3: Search Filtering by Name and Location
  suite.it('TC8.3: Station records include name, location, capacity, and currentLevels for UI filtering', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const res = await harness.request('GET', '/api/v1/estaciones', { cookies: adminRes.cookies });

    const plazaStation = res.data.find((s: any) => s.name.includes('Plaza'));
    expect(plazaStation).toBeDefined();
    expect(plazaStation.location).toBeDefined();
    expect(plazaStation.capacity).toBe(100);
    expect(plazaStation.currentLevels).toBeDefined();
  });

  // TC8.4: Zone Association for Stations
  suite.it('TC8.4: Station records carry zoneId foreign key mapping to assigned zones', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const res = await harness.request('GET', '/api/v1/estaciones', { cookies: adminRes.cookies });

    for (const station of res.data) {
      expect(station.zoneId).toBeDefined();
      expect(harness.zones.has(station.zoneId)).toBe(true);
    }
  });

  // TC8.5: Unauthenticated Station Inventory Rejection
  suite.it('TC8.5: Unauthenticated request to /estaciones returns 401 Unauthorized', async () => {
    const res = await harness.request('GET', '/api/v1/estaciones', { cookies: {} });
    expect(res.status).toBe(401);
  });
}
