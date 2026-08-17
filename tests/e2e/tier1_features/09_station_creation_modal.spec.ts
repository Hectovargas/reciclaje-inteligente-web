/**
 * Tier 1: Feature 9 - Zero-Touch Station Creation Modal
 * Validates modal creation form, status assignment with/without MAC, provisioning token generation, and errors.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerStationCreationModalTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 9: Zero-Touch Station Creation Modal', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC9.1: Form Validation for Required Station Fields
  suite.it('TC9.1: Creating station with missing required fields returns 400 Bad Request', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });

    // Missing location and zoneId
    const res = await harness.request('POST', '/api/v1/estaciones', {
      cookies: adminRes.cookies,
      body: { name: 'Estación Incompleta' },
    });

    expect(res.status).toBe(400);
    expect(res.data.message).toContain('Missing required');
  });

  // TC9.2: Station Creation with MAC Address -> PENDING_ACTIVATION
  suite.it('TC9.2: Creating station with MAC address assigns PENDING_ACTIVATION status and generates token', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });

    const res = await harness.request('POST', '/api/v1/estaciones', {
      cookies: adminRes.cookies,
      body: {
        name: 'Estación IoT Nueva',
        location: 'Campus Central',
        zoneId: 'zone-uuid-downtown-01',
        macAddress: 'CC:DD:EE:11:22:33',
        capacity: 150,
      },
    });

    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    expect(res.data.status).toBe('PENDING_ACTIVATION');
    expect(res.data.token).toBeDefined();
    expect(res.data.token.startsWith('PROV-TOK-')).toBe(true);
  });

  // TC9.3: Station Creation without MAC -> ACTIVE
  suite.it('TC9.3: Creating standalone station without MAC defaults immediately to ACTIVE status', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });

    const res = await harness.request('POST', '/api/v1/estaciones', {
      cookies: adminRes.cookies,
      body: {
        name: 'Punto Limpio Manual',
        location: 'Edificio A, Planta Baja',
        zoneId: 'zone-uuid-downtown-01',
        capacity: 80,
      },
    });

    expect(res.status).toBe(201);
    expect(res.data.status).toBe('ACTIVE');
  });

  // TC9.4: Non-Existent Zone Rejection
  suite.it('TC9.4: Creating station assigned to non-existent zoneId returns 404 Not Found', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });

    const res = await harness.request('POST', '/api/v1/estaciones', {
      cookies: adminRes.cookies,
      body: {
        name: 'Estación Zona Fantasma',
        location: 'Sector Desconocido',
        zoneId: 'non-existent-zone-999',
      },
    });

    expect(res.status).toBe(404);
    expect(res.data.message).toContain('zoneId not found');
  });

  // TC9.5: Role Authorization Gating (ADMIN Only)
  suite.it('TC9.5: Regular citizen user cannot create stations (403 Forbidden)', async () => {
    const userRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });

    const res = await harness.request('POST', '/api/v1/estaciones', {
      cookies: userRes.cookies,
      body: {
        name: 'Estación No Autorizada',
        location: 'Sector X',
        zoneId: 'zone-uuid-downtown-01',
      },
    });

    expect(res.status).toBe(403);
  });
}
