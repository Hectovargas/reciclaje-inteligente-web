/**
 * Tier 1: Feature Coverage - Token Balance & Web3 Query Endpoints
 * Validates R2 & R3 (F5, F9): Token balances, transaction history, ERC-20 contract metadata.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { generateRandomEthereumAddress } from '../fixtures/contract.fixture';

export function registerBalanceWeb3Tests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Token Balance & Web3 APIs (F5, F9 / R2, R3)', 'Tier 1');

  suite.beforeEach(() => {
    harness.reset();
  });

  // TC8.1: Query Token Balance
  suite.it('TC8.1: GET /blockchain/balance/:address returns RECI token balance for user wallet', async () => {
    const address = TEST_CONSTANTS.USER_ALICE.address;
    const res = await harness.request('GET', `/api/v1/blockchain/balance/${address}`);

    expect(res.status).toBe(200);
    expect(res.data.usuario).toBe(address);
    expect(res.data.simbolo).toBe('RECI');
    expect(parseFloat(res.data.balance)).toBeGreaterThanOrEqual(150.0);
  });

  // TC8.2: Query Balance for Fresh Address
  suite.it('TC8.2: Query balance for fresh unused address returns 0.0 RECI', async () => {
    const freshAddress = generateRandomEthereumAddress();
    const res = await harness.request('GET', `/api/v1/blockchain/balance/${freshAddress}`);

    expect(res.status).toBe(200);
    expect(res.data.balance).toBe('0.0');
    expect(res.data.simbolo).toBe('RECI');
  });

  // TC8.3: Query Address Transaction History
  suite.it('TC8.3: GET /blockchain/transactions/:address returns list of confirmed event records', async () => {
    // Mint 50 RECI to Bob
    harness.blockchain.mint(TEST_CONSTANTS.USER_BOB.address, 50);

    const res = await harness.request('GET', `/api/v1/blockchain/transactions/${TEST_CONSTANTS.USER_BOB.address}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBeTruthy();
    expect(res.data.length).toBeGreaterThanOrEqual(1);
    expect(res.data[0].amount).toBe('50.0');
    expect(res.data[0].status).toBe('CONFIRMED');
  });

  // TC8.4: Smart Contract Core Metadata
  suite.it('TC8.4: ERC-20 contract properties conform to specification (PuntosReciclaje, RECI, 18 decimals)', async () => {
    expect(harness.blockchain.name).toBe('PuntosReciclaje');
    expect(harness.blockchain.symbol).toBe('RECI');
    expect(harness.blockchain.decimals).toBe(18);
  });

  // TC8.5: Role-Based Access Control Verification
  suite.it('TC8.5: Smart contract hasRole properly verifies MINTER_ROLE and DEFAULT_ADMIN_ROLE', async () => {
    const isAdmin = harness.blockchain.hasRole(
      harness.blockchain.adminRole,
      TEST_CONSTANTS.ADMIN_ADDRESS
    );
    const isMinter = harness.blockchain.hasRole(
      harness.blockchain.minterRole,
      TEST_CONSTANTS.ADMIN_ADDRESS
    );
    const isAliceMinter = harness.blockchain.hasRole(
      harness.blockchain.minterRole,
      TEST_CONSTANTS.USER_ALICE.address
    );

    expect(isAdmin).toBe(true);
    expect(isMinter).toBe(true);
    expect(isAliceMinter).toBe(false);
  });
}
