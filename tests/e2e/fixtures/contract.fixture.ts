/**
 * Blockchain & Smart Contract Fixtures for CleanCity E2E Tests
 */

import { ethers } from 'ethers';

export const RECOMPENSAS_RECICLAJE_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function mint(address to, uint256 amount) external',
  'function mintBatch(address[] calldata recipients, uint256[] calldata amounts) external',
  'function pause() external',
  'function unpause() external',
  'function paused() external view returns (bool)',
  'function hasRole(bytes32 role, address account) external view returns (bool)',
  'function MINTER_ROLE() external view returns (bytes32)',
  'function DEFAULT_ADMIN_ROLE() external view returns (bytes32)',
  'event TokensMinted(address indexed recipient, uint256 amount, string material)',
  'event BatchMintExecuted(uint256 totalRecipients, uint256 totalTokens)',
];

export interface BatchMintItem {
  recipientAddress: string;
  amount: number;
  material: string;
  claimToken: string;
}

export interface BatchMintJobPayload {
  batchId: string;
  items: BatchMintItem[];
  timestamp: string;
}

export interface BlockchainEventRecord {
  id: string;
  txHash: string;
  recipientAddress: string;
  amount: string;
  status: 'PENDING' | 'BATCHED' | 'CONFIRMED' | 'FAILED';
  blockNumber?: number;
  createdAt: string;
  updatedAt: string;
}

export function createValidBatchMintPayload(recipients?: string[], amounts?: number[]): BatchMintJobPayload {
  const defaultRecipients = [
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  ];
  const targetRecipients = recipients || defaultRecipients;
  const targetAmounts = amounts || targetRecipients.map((_, i) => (i + 1) * 10);

  const items: BatchMintItem[] = targetRecipients.map((addr, idx) => ({
    recipientAddress: addr,
    amount: targetAmounts[idx] ?? 10,
    material: 'Plástico',
    claimToken: `CLAIM-TOK-${Date.now()}-${idx}`,
  }));

  return {
    batchId: `BATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    items,
    timestamp: new Date().toISOString(),
  };
}

export function generateRandomEthereumAddress(): string {
  const wallet = ethers.Wallet.createRandom();
  return wallet.address;
}
