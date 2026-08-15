/**
 * Tier 2: Boundary & Corner Cases - Batch Minting & Smart Contract Boundaries
 * Validates empty arrays, mismatched lengths, zero address, paused contract, unauthorized roles.
 */

import { E2ERunner, expect } from '../runner';
import { E2ETestHarness } from '../harness/e2e-harness';
import { TEST_CONSTANTS } from '../config/test-constants';
import { ethers } from 'ethers';

export function registerBatchMintingBoundaryTests(harness: E2ETestHarness) {
  const suite = E2ERunner.createSuite('Smart Contract & Batch Minting Boundaries', 'Tier 2');

  suite.beforeEach(() => {
    harness.reset();
  });

  // BC6.1: Empty Recipient Array Reverts
  suite.it('BC6.1: Batch minting with empty recipient array throws EmptyBatch error', async () => {
    expect(() => {
      harness.blockchain.mintBatch([], []);
    }).toThrow('EmptyBatch');
  });

  // BC6.2: Array Length Mismatch Reverts
  suite.it('BC6.2: Batch minting with mismatched recipients and amounts lengths throws ArrayLengthMismatch', async () => {
    const recipients = [TEST_CONSTANTS.USER_ALICE.address, TEST_CONSTANTS.USER_BOB.address];
    const amounts = [10]; // only 1 amount for 2 recipients

    expect(() => {
      harness.blockchain.mintBatch(recipients, amounts);
    }).toThrow('ArrayLengthMismatch');
  });

  // BC6.3: Minting to Zero Address (0x000...000) Reverts
  suite.it('BC6.3: Minting to ZeroAddress (0x0000000000000000000000000000000000000000) reverts', async () => {
    expect(() => {
      harness.blockchain.mint(ethers.ZeroAddress, 50);
    }).toThrow('ERC20InvalidReceiver');
  });

  // BC6.4: Minting when Smart Contract is Paused Reverts
  suite.it('BC6.4: Calling mint or mintBatch when contract is paused throws EnforcedPause error', async () => {
    // Pause the contract
    harness.blockchain.pause();
    expect(harness.blockchain.paused).toBe(true);

    expect(() => {
      harness.blockchain.mint(TEST_CONSTANTS.USER_ALICE.address, 20);
    }).toThrow('EnforcedPause');

    // Unpause restores functionality
    harness.blockchain.unpause();
    expect(harness.blockchain.paused).toBe(false);

    const txHash = harness.blockchain.mint(TEST_CONSTANTS.USER_ALICE.address, 20);
    expect(txHash.startsWith('0x')).toBeTruthy();
  });

  // BC6.5: Unauthorized Caller Lacking MINTER_ROLE Reverts
  suite.it('BC6.5: Non-minter account attempting mintBatch reverts with AccessControlUnauthorizedAccount', async () => {
    const rogueCaller = '0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E';

    expect(() => {
      harness.blockchain.mintBatch(
        [TEST_CONSTANTS.USER_ALICE.address],
        [10],
        rogueCaller
      );
    }).toThrow('AccessControlUnauthorizedAccount');
  });
}
