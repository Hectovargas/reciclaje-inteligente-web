/**
 * Tier 1: Feature Coverage - Urban Zones Management
 * Validates R1 requirements & F3: CRUD of zones and access control.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidZonePayload } from '../fixtures/station.fixture';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerZoneTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Zonas Management (F3 / R1)', 'Tier 1');

  suite.beforeEach(async () => {
    harness.reset();
    // Default session: login as ADMIN
    await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
  });

  // TC2.1: Create Zone
  suite.it('TC2.1: Admin can create a new urban recycling zone (201 Created)', async () => {
    const payload = createValidZonePayload({ name: 'Zona Residencial Poniente' });
    const res = await harness.request('POST', '/api/v1/zonas', { body: payload });

    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    expect(res.data.name).toBe('Zona Residencial Poniente');
    expect(res.data.isActive).toBe(true);
  });

  // TC2.2: List All Active Zones
  suite.it('TC2.2: Authenticated users can list all active zones', async () => {
    const res = await harness.request('GET', '/api/v1/zonas');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBeTruthy();
    expect(res.data.length).toBeGreaterThanOrEqual(2);
    expect(res.data.every((z: any) => z.isActive === true)).toBeTruthy();
  });

  // TC2.3: Get Zone Details by ID
  suite.it('TC2.3: Get zone by ID returns zone metadata and attached station relations', async () => {
    const zoneId = 'zone-uuid-downtown-01';
    const res = await harness.request('GET', `/api/v1/zonas/${zoneId}`);

    expect(res.status).toBe(200);
    expect(res.data.id).toBe(zoneId);
    expect(res.data.name).toBe('Zona Centro Urbano');
    expect(Array.isArray(res.data.stations)).toBeTruthy();
  });

  // TC2.4: Update Zone
  suite.it('TC2.4: Admin can update zone name and active status', async () => {
    const zoneId = 'zone-uuid-northpark-02';
    const updatePayload = { name: 'Zona Parque Norte (Renovada)', isActive: false };
    const res = await harness.request('PATCH', `/api/v1/zonas/${zoneId}`, { body: updatePayload });

    expect(res.status).toBe(200);
    expect(res.data.name).toBe('Zona Parque Norte (Renovada)');
    expect(res.data.isActive).toBe(false);
  });

  // TC2.5: Filter Inactive Zones
  suite.it('TC2.5: Query param includeInactive=true includes deactivated zones in listing', async () => {
    const resActiveOnly = await harness.request('GET', '/api/v1/zonas?includeInactive=false');
    const resAll = await harness.request('GET', '/api/v1/zonas?includeInactive=true');

    expect(resActiveOnly.status).toBe(200);
    expect(resAll.status).toBe(200);
    expect(resAll.data.length).toBeGreaterThan(resActiveOnly.data.length);
  });
}
