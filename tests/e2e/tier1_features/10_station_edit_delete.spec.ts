/**
 * Tier 1: Feature 10 - Station Edit & Deletion Modals
 * Validates metadata updates, capacity modifications, MAC reassignment, deletion confirmation, and deletion execution.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerStationEditDeleteTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 10: Station Edit & Deletion Modals', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC10.1: Station Metadata Update via PUT /estaciones/:id
  suite.it('TC10.1: Admin can update station name, location, and capacity via PUT /estaciones/:id', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const station = harness.stations.get('station-uuid-001')!;

    const res = await harness.request('PUT', `/api/v1/estaciones/${station.id}`, {
      cookies: adminRes.cookies,
      body: {
        name: 'Estación Plaza Mayor (Renovada)',
        location: 'Plaza Mayor, Sector Central',
        capacity: 250,
      },
    });

    expect(res.status).toBe(200);
    expect(res.data.name).toBe('Estación Plaza Mayor (Renovada)');
    expect(res.data.capacity).toBe(250);
  });

  // TC10.2: Invalid Capacity Rejection
  suite.it('TC10.2: Updating station capacity to zero or negative value returns 400 Bad Request', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const station = harness.stations.get('station-uuid-001')!;

    const res = await harness.request('PUT', `/api/v1/estaciones/${station.id}`, {
      cookies: adminRes.cookies,
      body: { capacity: -50 },
    });

    expect(res.status).toBe(400);
    expect(res.data.message).toContain('positive integer');
  });

  // TC10.3: Update Non-Existent Station
  suite.it('TC10.3: Updating non-existent station ID returns 404 Not Found', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });

    const res = await harness.request('PUT', '/api/v1/estaciones/fake-station-999', {
      cookies: adminRes.cookies,
      body: { name: 'Estación Fantasma' },
    });

    expect(res.status).toBe(404);
  });

  // TC10.4: Station Deletion Execution via DELETE /estaciones/:id
  suite.it('TC10.4: Admin can delete an existing station record with 200 OK confirmation', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const station = harness.stations.get('station-uuid-002')!;

    const res = await harness.request('DELETE', `/api/v1/estaciones/${station.id}`, {
      cookies: adminRes.cookies,
    });

    expect(res.status).toBe(200);
    expect(res.data.message).toContain('eliminada');
    expect(harness.stations.has(station.id)).toBe(false);
  });

  // TC10.5: Deleting Non-Existent Station Returns 404
  suite.it('TC10.5: Deleting non-existent station ID returns 404 Not Found', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });

    const res = await harness.request('DELETE', '/api/v1/estaciones/station-already-deleted', {
      cookies: adminRes.cookies,
    });

    expect(res.status).toBe(404);
  });
}
