import { Test, TestingModule } from '@nestjs/testing';
import { BatchMintProcessor } from './batch-mint.processor';
import { BlockchainQueueService, BLOCKCHAIN_QUEUE_NAME } from './blockchain-queue.service';
import { BlockchainService } from './blockchain.service';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainEventStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ethers } from 'ethers';

describe('BullMQ Batch Minting & Queue - Adversarial & Idempotency Suite', () => {
  let processor: BatchMintProcessor;
  let queueService: BlockchainQueueService;
  let blockchainService: BlockchainService;
  let prisma: PrismaService;
  let mockQueue: any;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockImplementation((name, payload, opts) =>
        Promise.resolve({
          id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          data: payload,
          opts,
        }),
      ),
      getWaitingCount: jest.fn().mockResolvedValue(0),
      getActiveCount: jest.fn().mockResolvedValue(0),
      getCompletedCount: jest.fn().mockResolvedValue(0),
      getFailedCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchMintProcessor,
        BlockchainQueueService,
        {
          provide: getQueueToken(BLOCKCHAIN_QUEUE_NAME),
          useValue: mockQueue,
        },
        {
          provide: BlockchainService,
          useValue: {
            mint: jest.fn().mockResolvedValue({
              txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
              blockNumber: 500,
            }),
            mintBatch: jest.fn().mockResolvedValue({
              txHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
              batchId: 99,
              blockNumber: 501,
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            blockchainEvent: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
              update: jest.fn().mockResolvedValue({}),
            },
          },
        },
      ],
    }).compile();

    processor = module.get<BatchMintProcessor>(BatchMintProcessor);
    queueService = module.get<BlockchainQueueService>(BlockchainQueueService);
    blockchainService = module.get<BlockchainService>(BlockchainService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('1. Queue Ingestion & Boundary Parameter Validation', () => {
    it('should reject invalid recipient addresses before database entry or queuing', async () => {
      const invalidAddresses = [
        'not-an-address',
        '0x123',
        '0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
        '',
        '   ',
      ];

      for (const addr of invalidAddresses) {
        await expect(queueService.queueMintReward(addr, 10)).rejects.toThrow(
          BadRequestException,
        );
      }

      expect(prisma.blockchainEvent.create).not.toHaveBeenCalled();
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should reject non-positive amounts (0, negative, NaN)', async () => {
      const validAddress = ethers.Wallet.createRandom().address;

      await expect(queueService.queueMintReward(validAddress, 0)).rejects.toThrow(
        BadRequestException,
      );
      await expect(queueService.queueMintReward(validAddress, -100)).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        queueService.queueMintReward(validAddress, NaN as any),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.blockchainEvent.create).not.toHaveBeenCalled();
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should normalize EVM addresses to checksum format before saving and queuing', async () => {
      const randomWallet = ethers.Wallet.createRandom();
      const lowerAddress = randomWallet.address.toLowerCase();
      const checksumAddress = ethers.getAddress(lowerAddress);

      jest.spyOn(prisma.blockchainEvent, 'create').mockResolvedValue({
        id: 'event-uuid-norm',
        fromAddress: '0x0000000000000000000000000000000000000000',
        toAddress: checksumAddress,
        amount: 15.0,
        status: BlockchainEventStatus.PENDING,
        batchId: null,
        txHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await queueService.queueMintReward(lowerAddress, 15.0);

      expect(result).toBeDefined();
      expect(prisma.blockchainEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            toAddress: checksumAddress,
          }),
        }),
      );
      expect(mockQueue.add).toHaveBeenCalledWith(
        'mint-reward',
        expect.objectContaining({
          recipient: checksumAddress,
        }),
        expect.anything(),
      );
    });
  });

  describe('2. Batching Atomicity & TxHash Database Uniqueness Constraint', () => {
    it('should batch up to 25 items and assign distinct rowTxHash to prevent PostgreSQL @unique collision', async () => {
      const count = 5;
      const mockEvents = Array.from({ length: count }, (_, i) => ({
        id: `event-${i + 1}`,
        toAddress: ethers.Wallet.createRandom().address,
        fromAddress: '0x0000000000000000000000000000000000000000',
        amount: (i + 1) * 10,
        status: BlockchainEventStatus.PENDING,
        batchId: null,
        createdAt: new Date(Date.now() + i * 1000),
      }));

      jest.spyOn(prisma.blockchainEvent, 'findMany').mockResolvedValue(mockEvents as any);

      const mockJob = {
        id: 'job-batch-5',
        name: 'mint-reward',
        data: { eventId: 'event-1' },
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as unknown as Job;

      const result = await processor.process(mockJob);

      expect(result.success).toBe(true);
      expect(result.count).toBe(count);
      expect(result.txHash).toBe('0x2222222222222222222222222222222222222222222222222222222222222222');

      // Verify that all 5 database updates used unique rowTxHash values
      const updatedTxHashes = (prisma.blockchainEvent.update as jest.Mock).mock.calls.map(
        (call) => call[0].data.txHash,
      );

      expect(updatedTxHashes.length).toBe(count);
      const uniqueTxHashes = new Set(updatedTxHashes);
      expect(uniqueTxHashes.size).toBe(count);

      // Verify format '0x2222...#0', '0x2222...#1', etc.
      updatedTxHashes.forEach((hash, idx) => {
        expect(hash).toBe(`0x2222222222222222222222222222222222222222222222222222222222222222#${idx}`);
      });
    });

    it('should assign raw txHash without suffix when only 1 item is minted', async () => {
      const singleEvent = {
        id: 'event-solo',
        toAddress: ethers.Wallet.createRandom().address,
        fromAddress: '0x0000000000000000000000000000000000000000',
        amount: 50.0,
        status: BlockchainEventStatus.PENDING,
        batchId: null,
        createdAt: new Date(),
      };

      jest.spyOn(prisma.blockchainEvent, 'findMany').mockResolvedValue([singleEvent] as any);

      const mockJob = {
        id: 'job-solo',
        name: 'mint-reward',
        data: { eventId: 'event-solo' },
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as unknown as Job;

      const result = await processor.process(mockJob);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(prisma.blockchainEvent.update).toHaveBeenCalledWith({
        where: { id: 'event-solo' },
        data: {
          status: BlockchainEventStatus.CONFIRMED,
          txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
        },
      });
    });
  });

  describe('3. Idempotency & Duplicate Worker Invocations', () => {
    it('should gracefully skip execution if event is already CONFIRMED', async () => {
      jest.spyOn(prisma.blockchainEvent, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.blockchainEvent, 'findUnique').mockResolvedValue({
        id: 'event-already-done',
        status: BlockchainEventStatus.CONFIRMED,
        txHash: '0xexistinghash123',
      } as any);

      const mockJob = {
        id: 'job-dup-confirmed',
        name: 'mint-reward',
        data: { eventId: 'event-already-done' },
      } as unknown as Job;

      const result = await processor.process(mockJob);

      expect(result.status).toBe(BlockchainEventStatus.CONFIRMED);
      expect(blockchainService.mint).not.toHaveBeenCalled();
      expect(blockchainService.mintBatch).not.toHaveBeenCalled();
      expect(prisma.blockchainEvent.updateMany).not.toHaveBeenCalled();
    });

    it('should gracefully skip execution if event is already BATCHED', async () => {
      jest.spyOn(prisma.blockchainEvent, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.blockchainEvent, 'findUnique').mockResolvedValue({
        id: 'event-in-flight',
        status: BlockchainEventStatus.BATCHED,
        batchId: 'batch-active-123',
      } as any);

      const mockJob = {
        id: 'job-dup-batched',
        name: 'mint-reward',
        data: { eventId: 'event-in-flight' },
      } as unknown as Job;

      const result = await processor.process(mockJob);

      expect(result.status).toBe(BlockchainEventStatus.BATCHED);
      expect(blockchainService.mint).not.toHaveBeenCalled();
      expect(blockchainService.mintBatch).not.toHaveBeenCalled();
    });
  });

  describe('4. Fault Tolerance & Retry State Machine Transitions', () => {
    it('should roll back status from BATCHED back to PENDING on transient error (attempt 0 or 1)', async () => {
      const mockEvent = {
        id: 'event-retryable',
        toAddress: ethers.Wallet.createRandom().address,
        amount: 10.0,
        status: BlockchainEventStatus.PENDING,
      };

      jest.spyOn(prisma.blockchainEvent, 'findMany').mockResolvedValue([mockEvent] as any);
      jest.spyOn(blockchainService, 'mint').mockRejectedValue(new Error('EVM gas price surge'));

      const mockJob = {
        id: 'job-transient-1',
        name: 'mint-reward',
        data: { eventId: 'event-retryable' },
        attemptsMade: 1, // 2nd attempt out of 3
        opts: { attempts: 3 },
      } as unknown as Job;

      await expect(processor.process(mockJob)).rejects.toThrow('EVM gas price surge');

      // Verify roll back to PENDING
      expect(prisma.blockchainEvent.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: BlockchainEventStatus.PENDING,
            batchId: null,
          },
        }),
      );
    });

    it('should transition status to FAILED permanently on max attempts exhausted (attempt 2 of 3)', async () => {
      const mockEvent = {
        id: 'event-terminal',
        toAddress: ethers.Wallet.createRandom().address,
        amount: 10.0,
        status: BlockchainEventStatus.PENDING,
      };

      jest.spyOn(prisma.blockchainEvent, 'findMany').mockResolvedValue([mockEvent] as any);
      jest.spyOn(blockchainService, 'mint').mockRejectedValue(new Error('Invalid operator signature'));

      const mockJob = {
        id: 'job-terminal-fail',
        name: 'mint-reward',
        data: { eventId: 'event-terminal' },
        attemptsMade: 2, // 3rd and final attempt (attemptsMade >= 3 - 1)
        opts: { attempts: 3 },
      } as unknown as Job;

      await expect(processor.process(mockJob)).rejects.toThrow('Invalid operator signature');

      // Verify transition to FAILED
      expect(prisma.blockchainEvent.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: BlockchainEventStatus.FAILED,
          },
        }),
      );
    });
  });
});
