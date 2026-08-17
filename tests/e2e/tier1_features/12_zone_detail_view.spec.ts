/**
 * Tier 1: Feature 12 - Zone Detail View (/admin/zonas/[id])
 * Validates zone loading, station list scope, analytics, and navigation.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerZoneDetailViewTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 12: Zone Detail View (/admin/zonas/[id])', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC12.1: Zone Detail Page Data Loading
  suite.it('TC12.1: GET /zonas/:id retrieves zone details along with assigned stations', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const zoneId = 'zone-uuid-downtown-01';

    const res = await harness.request('GET', `/api/v1/zonas/${zoneId}`, { cookies: adminRes.cookies });

    expect(res.status).toBe(200);
    expect(res.data.id).toBe(zoneId);
    expect(res.data.name).toBe('Zona Centro Urbano');
    expect(Array.isArray(res.data.stations)).toBe(true);
  });

  // TC12.2: Station Grid Filtered strictly to Zone
  suite.it('TC12.2: Stations returned inside zone detail belong exclusively to the queried zone', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const zoneId = 'zone-uuid-downtown-01';

    const res = await harness.request('GET', `/api/v1/zonas/${zoneId}`, { cookies: adminRes.cookies });

    for (const st of res.data.stations) {
      expect(st.zoneId).toBe(zoneId);
    }
  });

  // TC12.3: Non-Existent Zone Returns 404
  suite.it('TC12.3: Querying invalid zone ID returns 404 Not Found', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });

    const res = await harness.request('GET', '/api/v1/zonas/non-existent-zone-999', { cookies: adminRes.cookies });
    expect(res.status).toBe(404);
  });

  // TC12.4: Empty Zone Stations Handling
  suite.it('TC12.4: Zone with no assigned stations returns an empty stations array', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const industrialZone = 'zone-uuid-industrial-03';

    const res = await harness.request('GET', `/api/v1/zonas/${industrialZone}`, { cookies: adminRes.cookies });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.stations)).toBe(true);
    expect(res.data.stations.length).toBe(0);
  });

  // TC12.5: Unauthenticated Zone Detail Rejection
  suite.it('TC12.5: Unauthenticated request to /zonas/:id returns 401 Unauthorized', async () => {
    const res = await harness.request('GET', '/api/v1/zonas/zone-uuid-downtown-01', { cookies: {} });
    expect(res.status).toBe(401);
  });
}
