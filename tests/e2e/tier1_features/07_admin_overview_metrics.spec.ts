/**
 * Tier 1: Feature 7 - Admin Overview View (/admin)
 * Validates KPI metrics loading, polling data, material breakdown, and count-up values.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerAdminOverviewMetricsTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 7: Admin Overview View (/admin)', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC7.1: Aggregated KPI Metric Retrieval
  suite.it('TC7.1: GET /dashboard/metrics returns total recycled, accuracy, CO2 savings, and station counts', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const metricsRes = await harness.request('GET', '/api/v1/dashboard/metrics', { cookies: adminRes.cookies });

    expect(metricsRes.status).toBe(200);
    expect(metricsRes.data.totalReciclado).toBeDefined();
    expect(metricsRes.data.precisionIA).toBeDefined();
    expect(metricsRes.data.ahorroCo2Kg).toBeDefined();
    expect(metricsRes.data.desgloseMateriales).toBeDefined();
    expect(metricsRes.data.estacionesActivas).toBeDefined();
  });

  // TC7.2: Real-Time Telemetry Event Reflection in Metrics
  suite.it('TC7.2: New classification events increment totalReciclado and material breakdown counters', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const station = harness.stations.get('station-uuid-001')!;

    // Initial metrics
    const initialMetrics = await harness.request('GET', '/api/v1/dashboard/metrics', { cookies: adminRes.cookies });
    const initTotal = initialMetrics.data.totalReciclado;

    // Post classification event
    await harness.request('POST', '/api/v1/clasificacion', {
      headers: { 'x-station-token': station.token },
      body: {
        categoria: 'Plástico',
        confianza: 0.98,
        stationId: station.id,
      },
    });

    // Updated metrics
    const updatedMetrics = await harness.request('GET', '/api/v1/dashboard/metrics', { cookies: adminRes.cookies });
    expect(updatedMetrics.data.totalReciclado).toBe(initTotal + 1);
    expect(updatedMetrics.data.desgloseMateriales.plastico).toBeGreaterThan(0);
  });

  // TC7.3: Accuracy and Environmental Savings Projections
  suite.it('TC7.3: Environmental savings (CO2 kg) scale proportionally with recycled material volume', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const metrics = await harness.request('GET', '/api/v1/dashboard/metrics', { cookies: adminRes.cookies });

    expect(metrics.data.ahorroCo2Kg).toBe(metrics.data.totalReciclado * 1.5);
    expect(metrics.data.precisionIA).toBeGreaterThan(90);
  });

  // TC7.4: Active vs Warning Station Health Counts
  suite.it('TC7.4: Dashboard tracks active stations and stations requiring maintenance', async () => {
    const adminRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('ADMIN') });
    const metrics = await harness.request('GET', '/api/v1/dashboard/metrics', { cookies: adminRes.cookies });

    expect(typeof metrics.data.estacionesActivas).toBe('number');
    expect(typeof metrics.data.estacionesAlerta).toBe('number');
    expect(metrics.data.estacionesActivas).toBeGreaterThanOrEqual(1);
  });

  // TC7.5: Unauthenticated Metrics Access Rejection
  suite.it('TC7.5: Unauthenticated access to /dashboard/metrics is rejected with 401 Unauthorized', async () => {
    const res = await harness.request('GET', '/api/v1/dashboard/metrics', { cookies: {} });
    expect(res.status).toBe(401);
  });
}
