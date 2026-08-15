import { Test, TestingModule } from '@nestjs/testing';
import { BatchMintProcessor } from './batch-mint.processor';
import { BlockchainService } from './blockchain.service';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainEventStatus } from '@prisma/client';
import { Job } from 'bullmq';

describe('BatchMintProcessor', () => {
  let processor: BatchMintProcessor;
  let blockchainService: BlockchainService;
  let prisma: PrismaService;

  const mockPendingEvents = [
    {
      id: 'event-1',
      toAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      fromAddress: '0x0000000000000000000000000000000000000000',
      amount: 10.0,
      status: BlockchainEventStatus.PENDING,
      batchId: null,
      createdAt: new Date(),
    },
    {
      id: 'event-2',
      toAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      fromAddress: '0x0000000000000000000000000000000000000000',
      amount: 20.0,
      status: BlockchainEventStatus.PENDING,
      batchId: null,
      createdAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchMintProcessor,
        {
          provide: BlockchainService,
          useValue: {
            mint: jest.fn().mockResolvedValue({
              txHash: '0xmockSingleTxHash1234567890abcdef',
              blockNumber: 100,
            }),
            mintBatch: jest.fn().mockResolvedValue({
              txHash: '0xmockBatchTxHash1234567890abcdef',
              batchId: 7,
              blockNumber: 101,
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            blockchainEvent: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              updateMany: jest.fn().mockResolvedValue({ count: 2 }),
              update: jest.fn().mockResolvedValue({}),
            },
          },
        },
      ],
    }).compile();

    processor = module.get<BatchMintProcessor>(BatchMintProcessor);
    blockchainService = module.get<BlockchainService>(BlockchainService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should batch multiple pending events, call mintBatch and confirm events with txHash', async () => {
      jest
        .spyOn(prisma.blockchainEvent, 'findMany')
        .mockResolvedValue(mockPendingEvents as any);

      const mockJob = {
        id: 'job-1',
        name: 'mint-reward',
        data: { eventId: 'event-1', recipient: mockPendingEvents[0].toAddress, amount: 10 },
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as unknown as Job;

      const result = await processor.process(mockJob);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.txHash).toBe('0xmockBatchTxHash1234567890abcdef');

      // Verify status transition to BATCHED
      expect(prisma.blockchainEvent.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['event-1', 'event-2'] },
            status: BlockchainEventStatus.PENDING,
          }),
          data: expect.objectContaining({
            status: BlockchainEventStatus.BATCHED,
          }),
        }),
      );

      // Verify mintBatch call
      expect(blockchainService.mintBatch).toHaveBeenCalledWith(
        ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'],
        [10.0, 20.0],
      );

      // Verify update to CONFIRMED
      expect(prisma.blockchainEvent.update).toHaveBeenCalledTimes(2);
    });

    it('should call single mint when only 1 pending event exists', async () => {
      jest
        .spyOn(prisma.blockchainEvent, 'findMany')
        .mockResolvedValue([mockPendingEvents[0]] as any);

      const mockJob = {
        id: 'job-single',
        name: 'mint-reward',
        data: { eventId: 'event-1', recipient: mockPendingEvents[0].toAddress, amount: 10 },
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as unknown as Job;

      const result = await processor.process(mockJob);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(blockchainService.mint).toHaveBeenCalledWith(
        mockPendingEvents[0].toAddress,
        mockPendingEvents[0].amount,
      );
      expect(prisma.blockchainEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'event-1' },
          data: expect.objectContaining({
            status: BlockchainEventStatus.CONFIRMED,
            txHash: '0xmockSingleTxHash1234567890abcdef',
          }),
        }),
      );
    });

    it('should skip processing if no pending events exist', async () => {
      jest.spyOn(prisma.blockchainEvent, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.blockchainEvent, 'findUnique').mockResolvedValue({
        id: 'event-1',
        status: BlockchainEventStatus.CONFIRMED,
      } as any);

      const mockJob = {
        id: 'job-none',
        name: 'mint-reward',
        data: { eventId: 'event-1' },
      } as unknown as Job;

      const result = await processor.process(mockJob);
      expect(result.status).toBe(BlockchainEventStatus.CONFIRMED);
      expect(blockchainService.mintBatch).not.toHaveBeenCalled();
    });

    it('should revert events to PENDING on retryable failure', async () => {
      jest
        .spyOn(prisma.blockchainEvent, 'findMany')
        .mockResolvedValue(mockPendingEvents as any);
      jest
        .spyOn(blockchainService, 'mintBatch')
        .mockRejectedValue(new Error('RPC network timeout'));

      const mockJob = {
        id: 'job-fail-1',
        name: 'mint-reward',
        data: { eventId: 'event-1' },
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as unknown as Job;

      await expect(processor.process(mockJob)).rejects.toThrow('RPC network timeout');

      expect(prisma.blockchainEvent.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: BlockchainEventStatus.PENDING,
            batchId: null,
          }),
        }),
      );
    });

    it('should mark events as FAILED when max attempts are reached', async () => {
      jest
        .spyOn(prisma.blockchainEvent, 'findMany')
        .mockResolvedValue(mockPendingEvents as any);
      jest
        .spyOn(blockchainService, 'mintBatch')
        .mockRejectedValue(new Error('Out of gas'));

      const mockJob = {
        id: 'job-fail-final',
        name: 'mint-reward',
        data: { eventId: 'event-1' },
        attemptsMade: 2, // 3rd and final attempt
        opts: { attempts: 3 },
      } as unknown as Job;

      await expect(processor.process(mockJob)).rejects.toThrow('Out of gas');

      expect(prisma.blockchainEvent.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: BlockchainEventStatus.FAILED,
          }),
        }),
      );
    });
  });
});
