/**
 * Tier 2: Boundary & Corner Cases - Zones & Stations Boundaries
 * Validates empty names, duplicate zone names, non-existent foreign keys, invalid capacity values.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidLoginPayload } from '../fixtures/auth.fixture';
import { createValidStationPayload } from '../fixtures/station.fixture';

export function registerZonesStationsBoundaryTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Zones & Stations Boundary Constraints', 'Tier 2');

  suite.beforeEach(async () => {
    harness.reset();
    await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
  });

  // BC2.1: Empty or Whitespace-Only Zone Name
  suite.it('BC2.1: Creating zone with empty or whitespace string name returns 400 Bad Request', async () => {
    const res1 = await harness.request('POST', '/api/v1/zonas', { body: { name: '' } });
    expect(res1.status).toBe(400);

    const res2 = await harness.request('POST', '/api/v1/zonas', { body: { name: '   ' } });
    expect(res2.status).toBe(400);
  });

  // BC2.2: Duplicate Zone Name -> 409 Conflict
  suite.it('BC2.2: Creating zone with existing name returns 409 Conflict', async () => {
    const res = await harness.request('POST', '/api/v1/zonas', {
      body: { name: 'Zona Centro Urbano' }, // Already exists
    });
    expect(res.status).toBe(409);
    expect(res.data.message).toContain('already exists');
  });

  // BC2.3: Non-Existent ZoneId in Station Creation -> 404 Not Found
  suite.it('BC2.3: Creating station referencing non-existent zoneId returns 404 Not Found', async () => {
    const payload = createValidStationPayload('non-existent-zone-uuid-999');
    const res = await harness.request('POST', '/api/v1/estaciones', { body: payload });
    expect(res.status).toBe(404);
    expect(res.data.message).toContain('zoneId not found');
  });

  // BC2.4: Station Capacity <= 0 or Non-Integer Input
  suite.it('BC2.4: Station creation with zero or negative capacity returns 400 Bad Request', async () => {
    const payloadZero = createValidStationPayload('zone-uuid-downtown-01', { capacity: 0 });
    const resZero = await harness.request('POST', '/api/v1/estaciones', { body: payloadZero });
    expect(resZero.status).toBe(400);

    const payloadNeg = createValidStationPayload('zone-uuid-downtown-01', { capacity: -50 });
    const resNeg = await harness.request('POST', '/api/v1/estaciones', { body: payloadNeg });
    expect(resNeg.status).toBe(400);
  });

  // BC2.5: Non-Admin Role Zone Creation Attempt -> 403 Forbidden
  suite.it('BC2.5: Regular USER or VIEWER attempting to create zone receives 403 Forbidden', async () => {
    // Switch session to regular citizen
    await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });

    const res = await harness.request('POST', '/api/v1/zonas', {
      body: { name: 'Zona No Autorizada' },
    });
    expect(res.status).toBe(403);
  });
}
