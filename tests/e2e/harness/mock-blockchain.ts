/**
 * High-Fidelity Mock Blockchain & BullMQ Engine for CleanCity E2E Tests
 * Simulates RecompensasReciclaje ERC-20 contract rules and BullMQ worker dynamics.
 */

import { ethers } from 'ethers';
import { TEST_CONSTANTS } from '../config/test-constants';
import { BatchMintJobPayload, BlockchainEventRecord } from '../fixtures/contract.fixture';

export class MockBlockchainEngine {
  public name = 'PuntosReciclaje';
  public symbol = 'RECI';
  public decimals = 18;
  public totalSupply: bigint = 0n;
  public paused: boolean = false;

  public adminAddress: string = TEST_CONSTANTS.ADMIN_ADDRESS.toLowerCase();
  public minterRole: string = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'));
  public adminRole: string = ethers.ZeroHash;

  private roles: Map<string, Set<string>> = new Map();
  private balances: Map<string, bigint> = new Map();
  private blockchainEvents: Map<string, BlockchainEventRecord> = new Map();
  private bullMqQueue: BatchMintJobPayload[] = [];
  private processedTokens: Set<string> = new Set();
  private nonce: number = 0;

  constructor() {
    // Grant roles to Admin
    this.grantRole(this.adminRole, this.adminAddress);
    this.grantRole(this.minterRole, this.adminAddress);

    // Initial seed balance for Alice
    this.balances.set(TEST_CONSTANTS.USER_ALICE.address.toLowerCase(), ethers.parseUnits('150', 18));
    this.totalSupply += ethers.parseUnits('150', 18);
  }

  public hasRole(role: string, account: string): boolean {
    const members = this.roles.get(role);
    return members ? members.has(account.toLowerCase()) : false;
  }

  public grantRole(role: string, account: string, caller: string = this.adminAddress): boolean {
    if (caller.toLowerCase() !== this.adminAddress.toLowerCase()) {
      throw new Error(`AccessControlUnauthorizedAccount: caller lacks DEFAULT_ADMIN_ROLE`);
    }
    if (!this.roles.has(role)) {
      this.roles.set(role, new Set());
    }
    this.roles.get(role)!.add(account.toLowerCase());
    return true;
  }

  public pause(caller: string = this.adminAddress) {
    if (caller.toLowerCase() !== this.adminAddress.toLowerCase()) {
      throw new Error(`AccessControlUnauthorizedAccount: caller lacks DEFAULT_ADMIN_ROLE`);
    }
    this.paused = true;
  }

  public unpause(caller: string = this.adminAddress) {
    if (caller.toLowerCase() !== this.adminAddress.toLowerCase()) {
      throw new Error(`AccessControlUnauthorizedAccount: caller lacks DEFAULT_ADMIN_ROLE`);
    }
    this.paused = false;
  }

  public balanceOf(account: string): string {
    const balanceWei = this.balances.get(account.toLowerCase()) || 0n;
    return ethers.formatUnits(balanceWei, this.decimals);
  }

  public mint(to: string, amount: number | bigint, caller: string = this.adminAddress): string {
    if (this.paused) {
      throw new Error('EnforcedPause: contract is paused');
    }
    if (!this.hasRole(this.minterRole, caller)) {
      throw new Error(`AccessControlUnauthorizedAccount: caller ${caller} lacks MINTER_ROLE`);
    }
    if (!to || to === ethers.ZeroAddress || !ethers.isAddress(to)) {
      throw new Error('ERC20InvalidReceiver: zero or invalid recipient address');
    }

    const amountWei = typeof amount === 'bigint' ? amount : ethers.parseUnits(amount.toString(), this.decimals);
    if (amountWei <= 0n) {
      throw new Error('InvalidAmount: mint amount must be strictly positive');
    }

    const currentBal = this.balances.get(to.toLowerCase()) || 0n;
    this.balances.set(to.toLowerCase(), currentBal + amountWei);
    this.totalSupply += amountWei;
    this.nonce += 1;

    const txHash = ethers.keccak256(
      ethers.toUtf8Bytes(`TX-${to}-${amountWei.toString()}-${Date.now()}-${this.nonce}`)
    );

    const eventRecord: BlockchainEventRecord = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      txHash,
      recipientAddress: to.toLowerCase(),
      amount: ethers.formatUnits(amountWei, this.decimals),
      status: 'CONFIRMED',
      blockNumber: 1000000 + this.nonce,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.blockchainEvents.set(txHash, eventRecord);

    return txHash;
  }

  public mintBatch(
    recipients: string[],
    amounts: (number | bigint)[],
    caller: string = this.adminAddress
  ): { txHash: string; totalMinted: string; count: number } {
    if (this.paused) {
      throw new Error('EnforcedPause: contract is paused');
    }
    if (!this.hasRole(this.minterRole, caller)) {
      throw new Error(`AccessControlUnauthorizedAccount: caller lacks MINTER_ROLE`);
    }
    if (!recipients || recipients.length === 0) {
      throw new Error('EmptyBatch: recipients array must not be empty');
    }
    if (recipients.length !== amounts.length) {
      throw new Error('ArrayLengthMismatch: recipients and amounts length mismatch');
    }

    let batchTotalWei = 0n;
    for (let i = 0; i < recipients.length; i++) {
      const to = recipients[i];
      const amt = amounts[i];
      if (!to || to === ethers.ZeroAddress || !ethers.isAddress(to)) {
        throw new Error(`ERC20InvalidReceiver at index ${i}`);
      }
      const amtWei = typeof amt === 'bigint' ? amt : ethers.parseUnits(amt.toString(), this.decimals);
      if (amtWei <= 0n) {
        throw new Error(`InvalidAmount at index ${i}`);
      }
      const cur = this.balances.get(to.toLowerCase()) || 0n;
      this.balances.set(to.toLowerCase(), cur + amtWei);
      batchTotalWei += amtWei;
    }

    this.totalSupply += batchTotalWei;
    this.nonce += 1;
    const txHash = ethers.keccak256(
      ethers.toUtf8Bytes(`BATCH-TX-${recipients.length}-${batchTotalWei.toString()}-${Date.now()}-${this.nonce}`)
    );

    for (let i = 0; i < recipients.length; i++) {
      const to = recipients[i];
      const amtWei = typeof amounts[i] === 'bigint' ? (amounts[i] as bigint) : ethers.parseUnits(amounts[i].toString(), this.decimals);
      const subId = `evt-batch-${Date.now()}-${i}`;
      this.blockchainEvents.set(`${txHash}-${i}`, {
        id: subId,
        txHash,
        recipientAddress: to.toLowerCase(),
        amount: ethers.formatUnits(amtWei, this.decimals),
        status: 'CONFIRMED',
        blockNumber: 1000000 + this.nonce,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      txHash,
      totalMinted: ethers.formatUnits(batchTotalWei, this.decimals),
      count: recipients.length,
    };
  }

  // BullMQ Queue Methods
  public enqueueBatchMint(job: BatchMintJobPayload): { jobId: string; status: 'QUEUED' } {
    this.bullMqQueue.push(job);
    return {
      jobId: `job-${job.batchId}`,
      status: 'QUEUED',
    };
  }

  public processBullMqBatch(caller: string = this.adminAddress) {
    if (this.bullMqQueue.length === 0) return null;
    const job = this.bullMqQueue.shift()!;
    
    // Idempotency check: discard already processed claim tokens
    const validItems = job.items.filter(item => !this.processedTokens.has(item.claimToken));
    if (validItems.length === 0) {
      return { status: 'SKIPPED_ALL_DUPLICATES', count: 0 };
    }

    const recipients = validItems.map(i => i.recipientAddress);
    const amounts = validItems.map(i => i.amount);

    const result = this.mintBatch(recipients, amounts, caller);
    validItems.forEach(i => this.processedTokens.add(i.claimToken));

    return {
      status: 'PROCESSED',
      batchId: job.batchId,
      txHash: result.txHash,
      count: result.count,
      totalMinted: result.totalMinted,
    };
  }

  public getTransactionsForAddress(address: string): BlockchainEventRecord[] {
    const normalized = address.toLowerCase();
    const results: BlockchainEventRecord[] = [];
    for (const evt of this.blockchainEvents.values()) {
      if (evt.recipientAddress === normalized) {
        results.push(evt);
      }
    }
    return results;
  }
}
