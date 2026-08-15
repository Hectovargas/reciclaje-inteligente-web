/**
 * Tier 2: Boundary & Corner Cases - Balance & Transaction Query Boundaries
 * Validates invalid hex addresses, pagination bounds, BigInt precision safety.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { ethers } from 'ethers';

export function registerBalanceQueryBoundaryTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Balance & Query Boundary Constraints', 'Tier 2');

  suite.beforeEach(() => {
    harness.reset();
  });

  // BC7.1: Malformed Ethereum Address in GET /blockchain/balance/:address -> 400
  suite.it('BC7.1: Querying balance with malformed address (non-hex, wrong length) returns 400', async () => {
    const res = await harness.request('GET', '/api/v1/blockchain/balance/not-an-eth-address');
    expect(res.status).toBe(400);
    expect(res.data.message).toContain('Invalid Ethereum address');
  });

  // BC7.2: Malformed Address in GET /blockchain/transactions/:address -> 400
  suite.it('BC7.2: Querying transactions with invalid address format returns 400 Bad Request', async () => {
    const res = await harness.request('GET', '/api/v1/blockchain/transactions/0x1234invalid');
    expect(res.status).toBe(400);
    expect(res.data.message).toContain('Invalid Ethereum address');
  });

  // BC7.3: Classification Event History Pagination Negative Bounds
  suite.it('BC7.3: Classification history with page=0 or limit=-5 returns 400 Bad Request', async () => {
    const res = await harness.request('GET', '/api/v1/clasificacion?page=0&limit=-5', {
      cookies: { access_token: 'mock-jwt-admin@recicla.com-ADMIN' },
    });
    expect(res.status).toBe(400);
    expect(res.data.message).toContain('must be positive');
  });

  // BC7.4: Extreme Large Balance BigInt Precision (No Floating Point Overflow)
  suite.it('BC7.4: Extreme token balances (e.g. 100,000,000 RECI) preserve exact 18-decimal BigInt precision', async () => {
    const largeAmount = 100000000; // 100M tokens
    const targetAddr = TEST_CONSTANTS.USER_BOB.address;

    harness.blockchain.mint(targetAddr, largeAmount);
    const balanceStr = harness.blockchain.balanceOf(targetAddr);

    expect(balanceStr).toBe('100000000.0');

    // Balance query API reflection
    const res = await harness.request('GET', `/api/v1/blockchain/balance/${targetAddr}`);
    expect(res.status).toBe(200);
    expect(res.data.balance).toBe('100000000.0');
  });

  // BC7.5: Negative Mint Amount Rejection
  suite.it('BC7.5: Attempting to mint negative token amounts reverts with InvalidAmount', async () => {
    expect(() => {
      harness.blockchain.mint(TEST_CONSTANTS.USER_ALICE.address, -50);
    }).toThrow('InvalidAmount');
  });
}
