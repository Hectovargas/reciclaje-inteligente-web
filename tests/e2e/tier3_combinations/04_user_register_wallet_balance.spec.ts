/**
 * Tier 3: Cross-Feature Combinations - User Registration & Custodial Wallet Balance
 * Flow: User registers -> Custodial wallet created -> Initial balance check -> Minting -> Updated balance check.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { createValidRegisterPayload } from '../fixtures/auth.fixture';

export function registerUserRegisterWalletBalanceTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('User Registration & Custodial Wallet Sync', 'Tier 3');

  suite.beforeEach(() => {
    harness.reset();
  });

  // Combo 4.1: Fresh User Registration -> Initial 0.0 RECI Balance
  suite.it('Combo 4.1: Registering citizen automatically provisions wallet address with 0.0 RECI initial balance', async () => {
    const userPayload = createValidRegisterPayload({ email: 'new.citizen@cleancity.io' });
    const regRes = await harness.request('POST', '/api/v1/auth/register', { body: userPayload });

    expect(regRes.status).toBe(201);
    const walletAddress = regRes.data.walletAddress;
    expect(walletAddress).toBeDefined();

    // Query balance with new wallet address
    const balRes = await harness.request('GET', `/api/v1/blockchain/balance/${walletAddress}`);
    expect(balRes.status).toBe(200);
    expect(balRes.data.balance).toBe('0.0');
    expect(balRes.data.simbolo).toBe('RECI');
  });

  // Combo 4.2: Reward Minting Updates User Wallet Balance
  suite.it('Combo 4.2: Direct token mint to newly registered user wallet reflects immediately in balance query', async () => {
    const userPayload = createValidRegisterPayload({ email: 'rewarded.citizen@cleancity.io' });
    const regRes = await harness.request('POST', '/api/v1/auth/register', { body: userPayload });
    const walletAddress = regRes.data.walletAddress;

    // Admin mints 30 RECI to the citizen
    harness.blockchain.mint(walletAddress, 30);

    const balRes = await harness.request('GET', `/api/v1/blockchain/balance/${walletAddress}`);
    expect(balRes.status).toBe(200);
    expect(balRes.data.balance).toBe('30.0');
  });
}
