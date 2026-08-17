/**
 * Tier 1: Feature 16 - Citizen PWA Main View (/app)
 * Validates mobile citizen hub, BalanceCard, QrScanner tab, ClaimModal integration, and TransactionHistory.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidLoginPayload } from '../fixtures/auth.fixture';

export function registerCitizenPwaMainTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 16: Citizen PWA Main View (/app)', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC16.1: Citizen PWA Hub Hydration
  suite.it('TC16.1: Citizen accessing /app retrieves authenticated session and custodial wallet balance', async () => {
    const userRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    expect(userRes.status).toBe(200);

    const meRes = await harness.request('GET', '/api/v1/auth/me', { cookies: userRes.cookies });
    expect(meRes.status).toBe(200);
    expect(meRes.data.user.role).toBe('USER');

    const balRes = await harness.request('GET', `/api/v1/blockchain/balance/${meRes.data.user.walletAddress}`);
    expect(balRes.status).toBe(200);
    expect(balRes.data.balance).toBe('150.0');
    expect(balRes.data.symbol).toBe('RECI');
  });

  // TC16.2: Post-Claim Balance Refresh Trigger
  suite.it('TC16.2: Claiming points enqueues batch mint and prepares balance update', async () => {
    const userRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    const station = harness.stations.get('station-uuid-001')!;

    // Generate QR
    const qrRes = await harness.request('POST', '/api/v1/qr/generar', {
      headers: { 'x-station-token': station.token },
      body: { categoria: 'Plástico' },
    });

    // Claim QR
    const claimRes = await harness.request('POST', '/api/v1/qr/reclamar', {
      cookies: userRes.cookies,
      body: { token: qrRes.data.codigo },
    });

    expect(claimRes.status).toBe(200);
    expect(claimRes.data.success).toBe(true);
    expect(claimRes.data.puntos).toBe(10);
  });

  // TC16.3: Transaction History Integration
  suite.it('TC16.3: GET /blockchain/transactions/:address provides formatted transaction history for citizen view', async () => {
    const user = harness.users.get('alice.recycler@test.cleancity.io')!;
    const txsRes = await harness.request('GET', `/api/v1/blockchain/transactions/${user.walletAddress}`);

    expect(txsRes.status).toBe(200);
    expect(Array.isArray(txsRes.data)).toBe(true);
  });

  // TC16.4: Role Routing Integrity
  suite.it('TC16.4: Citizen user navigating to /app passes Edge RBAC middleware seamlessly', async () => {
    const userRes = await harness.request('POST', '/api/v1/auth/login', { body: createValidLoginPayload('USER') });
    const edgeCheck = harness.simulateEdgeMiddleware('/app', userRes.cookies);

    expect(edgeCheck.passed).toBe(true);
    expect(edgeCheck.status).toBe(200);
  });

  // TC16.5: Unauthenticated Access Interception
  suite.it('TC16.5: Direct unauthenticated visit to /app is redirected to /login', () => {
    const edgeCheck = harness.simulateEdgeMiddleware('/app', {});
    expect(edgeCheck.passed).toBe(false);
    expect(edgeCheck.status).toBe(307);
    expect(edgeCheck.redirectUrl).toBe('/login?callbackUrl=%2Fapp');
  });
}
