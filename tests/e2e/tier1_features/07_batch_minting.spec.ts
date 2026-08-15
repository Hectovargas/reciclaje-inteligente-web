/**
 * Tier 1: Feature Coverage - BullMQ Batch Minting Engine & Smart Contract
 * Validates R2 & R3 (F5, F8, F9): ERC-20 batch minting, queue processing, nonce safety.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { createValidBatchMintPayload } from '../fixtures/contract.fixture';

export function registerBatchMintingTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('BullMQ Batch Minting (F5, F8, F9 / R2, R3)', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC7.1: Enqueue Batch Minting Job
  suite.it('TC7.1: Producer enqueues batch minting job for accumulated recycling points', async () => {
    const jobPayload = createValidBatchMintPayload();
    const result = harness.blockchain.enqueueBatchMint(jobPayload);

    expect(result.status).toBe('QUEUED');
    expect(result.jobId.startsWith('job-BATCH-')).toBeTruthy();
  });

  // TC7.2: BullMQ Worker Batch Execution
  suite.it('TC7.2: BullMQ Worker processes queued batch, emits single on-chain transaction without nonce conflict', async () => {
    const recipients = [
      TEST_CONSTANTS.USER_ALICE.address,
      TEST_CONSTANTS.USER_BOB.address,
    ];
    const amounts = [50, 75];

    harness.blockchain.enqueueBatchMint(createValidBatchMintPayload(recipients, amounts));

    const processResult = harness.blockchain.processBullMqBatch();

    expect(processResult).toBeDefined();
    expect(processResult?.status).toBe('PROCESSED');
    expect(processResult?.count).toBe(2);
    expect(processResult?.txHash.startsWith('0x')).toBeTruthy();
  });

  // TC7.3: Persistence of Blockchain Event with Unique txHash
  suite.it('TC7.3: Batch mint execution persists blockchain event records with unique tx_hash', async () => {
    const recipients = [TEST_CONSTANTS.USER_ALICE.address];
    const amounts = [100];

    harness.blockchain.enqueueBatchMint(createValidBatchMintPayload(recipients, amounts));
    const processResult = harness.blockchain.processBullMqBatch();

    expect(processResult?.txHash).toBeDefined();

    const aliceTxs = harness.blockchain.getTransactionsForAddress(TEST_CONSTANTS.USER_ALICE.address);
    expect(aliceTxs.length).toBeGreaterThanOrEqual(1);
    expect(aliceTxs.some(tx => tx.txHash === processResult?.txHash)).toBeTruthy();
  });

  // TC7.4: Idempotency in Worker Processing
  suite.it('TC7.4: Idempotency protection prevents duplicate claim tokens from being minted twice', async () => {
    const jobPayload = createValidBatchMintPayload([TEST_CONSTANTS.USER_ALICE.address], [25]);

    // Enqueue identical job twice
    harness.blockchain.enqueueBatchMint(jobPayload);
    harness.blockchain.enqueueBatchMint(jobPayload);

    const firstRun = harness.blockchain.processBullMqBatch();
    expect(firstRun?.status).toBe('PROCESSED');
    expect(firstRun?.count).toBe(1);

    const secondRun = harness.blockchain.processBullMqBatch();
    expect(secondRun?.status).toBe('SKIPPED_ALL_DUPLICATES');
  });

  // TC7.5: Direct Admin Batch Mint API
  suite.it('TC7.5: POST /api/v1/blockchain/batch with ADMIN auth executes direct batch mint', async () => {
    // Login as Admin
    const loginRes = await harness.request('POST', '/api/v1/auth/login', {
      body: { email: TEST_CONSTANTS.ADMIN_USER.email, password: TEST_CONSTANTS.ADMIN_USER.password },
    });

    const res = await harness.request('POST', '/api/v1/blockchain/batch', {
      cookies: loginRes.cookies,
      body: {
        recipients: [TEST_CONSTANTS.USER_ALICE.address, TEST_CONSTANTS.USER_BOB.address],
        amounts: [20, 30],
      },
    });

    expect(res.status).toBe(200);
    expect(res.data.txHash).toBeDefined();
    expect(res.data.count).toBe(2);
  });
}
