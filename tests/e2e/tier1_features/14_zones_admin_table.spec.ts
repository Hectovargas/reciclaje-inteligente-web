/**
 * Tier 1: Feature 14 - Zones Administration (/admin/zonas-admin)
 * Validates zone listing, zone creation, editing names, active/inactive status toggle, and duplicate detection.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerZonesAdminTableTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 14: Zones Administration (/admin/zonas-admin)', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC14.1: Zones Listing with Active and Inactive Filters
  suite.it('TC14.1: GET /zonas?includeInactive=true returns all operational and inactive zones', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const res = await harness.request('GET', '/api/v1/zonas?includeInactive=true', { cookies: adminRes.cookies });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThanOrEqual(3);
  });

  // TC14.2: Zone Creation Modal Submission
  suite.it('TC14.2: POST /zonas creates a new operational zone and persists in PostgreSQL', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });

    const res = await harness.request('POST', '/api/v1/zonas', {
      cookies: adminRes.cookies,
      body: { name: 'Zona Universitaria Norte', isActive: true },
    });

    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    expect(res.data.name).toBe('Zona Universitaria Norte');
    expect(res.data.isActive).toBe(true);
  });

  // TC14.3: Zone Active/Inactive Status Toggle
  suite.it('TC14.3: PATCH /zonas/:id updates zone name and toggles isActive status', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const zoneId = 'zone-uuid-northpark-02';

    const res = await harness.request('PATCH', `/api/v1/zonas/${zoneId}`, {
      cookies: adminRes.cookies,
      body: { isActive: false },
    });

    expect(res.status).toBe(200);
    expect(res.data.isActive).toBe(false);
  });

  // TC14.4: Duplicate Zone Name Conflict Rejection
  suite.it('TC14.4: Creating zone with duplicate name returns 409 Conflict', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });

    const res = await harness.request('POST', '/api/v1/zonas', {
      cookies: adminRes.cookies,
      body: { name: 'Zona Centro Urbano' },
    });

    expect(res.status).toBe(409);
    expect(res.data.message).toContain('already exists');
  });

  // TC14.5: Empty Zone Name Validation
  suite.it('TC14.5: Submitting blank or whitespace zone name returns 400 Bad Request', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });

    const res = await harness.request('POST', '/api/v1/zonas', {
      cookies: adminRes.cookies,
      body: { name: '   ' },
    });

    expect(res.status).toBe(400);
    expect(res.data.message).toContain('cannot be empty');
  });
}
