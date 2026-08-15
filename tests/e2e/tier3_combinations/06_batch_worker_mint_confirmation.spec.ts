/**
 * Tier 3: Cross-Feature Combinations - BullMQ Worker Execution & Event Confirmation
 * Flow: User claims QR -> Enqueued in BullMQ -> Worker runs batch mint -> Event persisted -> On-chain balance updated.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { generateCryptographicQR } from '../fixtures/qr.fixture';
import { createValidRegisterPayload } from '../fixtures/auth.fixture';

export function registerBatchWorkerMintConfirmationTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('BullMQ Worker Execution & Event Confirmation Sync', 'Tier 3');

  suite.beforeEach(() => {
    harness.reset();
  });

  // Combo 6.1: Full BullMQ Queue-to-Worker Processing Lifecycle
  suite.it('Combo 6.1: Claimed rewards in BullMQ queue are batch-processed by worker, updating user token balance', async () => {
    // 1. Register new citizen
    const regRes = await harness.request('POST', '/api/v1/auth/register', {
      body: createValidRegisterPayload({ email: 'worker.test@cleancity.io' }),
    });
    const userWallet = regRes.data.walletAddress;

    // 2. Generate and claim 2 QR tokens
    const qr1 = await generateCryptographicQR('Plástico');
    const qr2 = await generateCryptographicQR('Metal');
    harness.qrTokens.set(qr1.codigo, qr1);
    harness.qrTokens.set(qr2.codigo, qr2);

    await harness.request('POST', '/api/v1/qr/reclamar', {
      cookies: regRes.cookies,
      body: { token: qr1.codigo },
    });
    await harness.request('POST', '/api/v1/qr/reclamar', {
      cookies: regRes.cookies,
      body: { token: qr2.codigo },
    });

    // 3. Worker triggers batch processing
    const workerResult1 = harness.blockchain.processBullMqBatch();
    expect(workerResult1?.status).toBe('PROCESSED');

    const workerResult2 = harness.blockchain.processBullMqBatch();
    expect(workerResult2?.status).toBe('PROCESSED');

    // 4. Verify balance: 10 (Plástico) + 15 (Metal) = 25 RECI
    const balRes = await harness.request('GET', `/api/v1/blockchain/balance/${userWallet}`);
    expect(balRes.status).toBe(200);
    expect(balRes.data.balance).toBe('25.0');
  });

  // Combo 6.2: Blockchain Event Records Match Confirmed Transactions
  suite.it('Combo 6.2: Processed worker batch transactions appear in GET /blockchain/transactions/:address', async () => {
    const regRes = await harness.request('POST', '/api/v1/auth/register', {
      body: createValidRegisterPayload({ email: 'events.test@cleancity.io' }),
    });
    const userWallet = regRes.data.walletAddress;

    const qr = await generateCryptographicQR('Plástico');
    harness.qrTokens.set(qr.codigo, qr);

    await harness.request('POST', '/api/v1/qr/reclamar', {
      cookies: regRes.cookies,
      body: { token: qr.codigo },
    });

    harness.blockchain.processBullMqBatch();

    // Query user transactions
    const txRes = await harness.request('GET', `/api/v1/blockchain/transactions/${userWallet}`);
    expect(txRes.status).toBe(200);
    expect(txRes.data.length).toBeGreaterThanOrEqual(1);
    expect(txRes.data[0].status).toBe('CONFIRMED');
    expect(txRes.data[0].amount).toBe('10.0');
  });
}
