/**
 * Tier 1: Feature 20 - Web3 Custodial Balance & Transactions
 * Validates ERC-20 token balance retrieval, transaction listing, status badges, and address formatting.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';

export function registerWeb3BalanceTransactionsTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Feature 20: Web3 Custodial Balance & Transactions', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC20.1: Live RECI Token Balance Fetching
  suite.it('TC20.1: GET /blockchain/balance/:address returns formatted balance and RECI symbol', async () => {
    const userAddr = TEST_CONSTANTS.USER_ALICE.address;
    const res = await harness.request('GET', `/api/v1/blockchain/balance/${userAddr}`);

    expect(res.status).toBe(200);
    expect(res.data.balance).toBe('150.0');
    expect(res.data.symbol).toBe('RECI');
  });

  // TC20.2: Minted Tokens Reflection in Balance
  suite.it('TC20.2: Minting tokens via smart contract updates balance query immediately', async () => {
    const userAddr = TEST_CONSTANTS.USER_ALICE.address;

    // Mint 50 RECI (150 + 50 = 200)
    await harness.blockchain.mintBatch([userAddr], [50]);

    const res = await harness.request('GET', `/api/v1/blockchain/balance/${userAddr}`);
    expect(res.status).toBe(200);
    expect(res.data.balance).toBe('200.0');
  });

  // TC20.3: Transaction History Listing
  suite.it('TC20.3: GET /blockchain/transactions/:address retrieves list of confirmed on-chain transactions', async () => {
    const userAddr = TEST_CONSTANTS.USER_ALICE.address;

    await harness.blockchain.mintBatch([userAddr], [25]);

    const res = await harness.request('GET', `/api/v1/blockchain/transactions/${userAddr}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThanOrEqual(1);
    expect(res.data[0].amount).toBe('25.0');
    expect(res.data[0].status).toBe('CONFIRMED');
    expect(res.data[0].txHash.startsWith('0x')).toBe(true);
  });

  // TC20.4: Invalid EVM Address Format Rejection
  suite.it('TC20.4: Querying balance with malformed EVM address returns 400 Bad Request', async () => {
    const res = await harness.request('GET', '/api/v1/blockchain/balance/0xINVALID_ADDRESS_XYZ');
    expect(res.status).toBe(400);
    expect(res.data.message).toContain('Invalid');
  });

  // TC20.5: Case-Insensitive EVM Address Handling
  suite.it('TC20.5: Balance query handles lowercase and checksummed Ethereum addresses identically', async () => {
    const userAddr = TEST_CONSTANTS.USER_ALICE.address;
    await harness.blockchain.mintBatch([userAddr], [10]);

    const lowerRes = await harness.request('GET', `/api/v1/blockchain/balance/${userAddr.toLowerCase()}`);
    const checksumRes = await harness.request('GET', `/api/v1/blockchain/balance/${userAddr}`);

    expect(lowerRes.status).toBe(200);
    expect(checksumRes.status).toBe(200);
    expect(lowerRes.data.balance).toBe(checksumRes.data.balance);
  });
}
