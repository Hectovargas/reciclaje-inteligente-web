import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BlockchainEventStatus } from '@prisma/client';

export class BalanceResponseDto {
  @ApiProperty({ example: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' })
  address: string;

  @ApiProperty({ example: '25.5' })
  balance: string;

  @ApiProperty({ example: 'RECI' })
  symbol: string;

  @ApiProperty({ example: 18 })
  decimals: number;

  @ApiProperty({ example: '25500000000000000000' })
  rawBalance: string;

  @ApiProperty({ example: true })
  isLive: boolean;
}

export class BlockchainStatusResponseDto {
  @ApiProperty({ example: '0x5FbDB2315678afecb367f032d93F642f64180aa3' })
  contractAddress: string;

  @ApiProperty({ example: 'CleanCity Reciclaje' })
  tokenName: string;

  @ApiProperty({ example: 'RECI' })
  tokenSymbol: string;

  @ApiProperty({ example: 'Sepolia Testnet' })
  network: string;

  @ApiProperty({ example: 11155111 })
  chainId: number;

  @ApiProperty({ example: true })
  isConnected: boolean;

  @ApiProperty({ example: false })
  isPaused: boolean;

  @ApiProperty({ example: 4 })
  currentBatchId: number;

  @ApiProperty({
    example: {
      waiting: 0,
      active: 0,
      completed: 12,
      failed: 0,
      delayed: 0,
    },
  })
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
}

export class BlockchainEventItemDto {
  @ApiProperty({ example: 'b337c784-633b-48ae-8a42-5f653b6f0011' })
  id: string;

  @ApiPropertyOptional({ example: '0x8f2d...abc' })
  txHash: string | null;

  @ApiProperty({ example: '0x0000000000000000000000000000000000000000' })
  fromAddress: string;

  @ApiProperty({ example: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' })
  toAddress: string;

  @ApiProperty({ example: 15.0 })
  amount: number;

  @ApiProperty({ enum: BlockchainEventStatus, example: BlockchainEventStatus.CONFIRMED })
  status: BlockchainEventStatus;

  @ApiPropertyOptional({ example: 'batch-1723700000000-xyz' })
  batchId: string | null;

  @ApiProperty({ example: '2026-08-15T06:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-08-15T06:01:00.000Z' })
  updatedAt: Date;
}
