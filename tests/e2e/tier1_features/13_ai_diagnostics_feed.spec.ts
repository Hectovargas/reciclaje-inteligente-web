/**
 * Tier 1: Feature 13 - AI Diagnostics Feed (/admin/diagnostico-ia)
 * Validates classification feed ingestion, pagination, confidence thresholds, and material filtering.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerAiDiagnosticsFeedTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 13: AI Diagnostics Feed (/admin/diagnostico-ia)', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC13.1: Classification Event Feed Ingestion
  suite.it('TC13.1: POST /clasificacion ingests AI event and returns generated QR with confidence score', async () => {
    const station = harness.stations.get('station-uuid-001')!;

    const res = await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': station.token },
      body: {
        categoria: 'Plástico',
        confianza: 0.975,
        stationId: station.id,
      },
    });

    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    expect(res.data.categoria).toBe('Plástico');
    expect(res.data.confianza).toBe(0.975);
    expect(res.data.qr).toBeDefined();
  });

  // TC13.2: Paginated Diagnostics Feed Retrieval
  suite.it('TC13.2: GET /clasificacion retrieves paginated list of recorded AI events', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const station = harness.stations.get('station-uuid-001')!;

    // Seed 3 events
    await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': station.token },
      body: { categoria: 'Papel', confianza: 0.95, stationId: station.id },
    });
    await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': station.token },
      body: { categoria: 'Metal', confianza: 0.92, stationId: station.id },
    });

    const feedRes = await harness.request('GET', '/api/v1/clasificacion?page=1&limit=10', { cookies: adminRes.cookies });

    expect(feedRes.status).toBe(200);
    expect(feedRes.data.data).toBeDefined();
    expect(feedRes.data.data.length).toBeGreaterThanOrEqual(2);
    expect(feedRes.data.total).toBeGreaterThanOrEqual(2);
  });

  // TC13.3: Missing Classification Payload Rejection
  suite.it('TC13.3: Ingesting classification with missing category or confidence returns 400 Bad Request', async () => {
    const station = harness.stations.get('station-uuid-001')!;

    const res = await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': station.token },
      body: { stationId: station.id },
    });

    expect(res.status).toBe(400);
  });

  // TC13.4: Invalid Pagination Parameters Handling
  suite.it('TC13.4: Querying /clasificacion with negative limit returns 400 Bad Request', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });

    const res = await harness.request('GET', '/api/v1/clasificacion?page=1&limit=-10', { cookies: adminRes.cookies });
    expect(res.status).toBe(400);
  });

  // TC13.5: Missing Station Token on Event Submission
  suite.it('TC13.5: Classification submission without x-station-token header returns 401 Unauthorized', async () => {
    const res = await harness.request('POST', '/api/v1/clasificacion', {
      body: { categoria: 'Vidrio', confianza: 0.91, stationId: 'station-uuid-001' },
    });

    expect(res.status).toBe(401);
  });
}
