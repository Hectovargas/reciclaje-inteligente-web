import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainQueueService, BLOCKCHAIN_QUEUE_NAME } from './blockchain-queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import { BlockchainEventStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('BlockchainQueueService', () => {
  let service: BlockchainQueueService;
  let prisma: PrismaService;
  let mockQueue: any;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-12345' }),
      getWaitingCount: jest.fn().mockResolvedValue(2),
      getActiveCount: jest.fn().mockResolvedValue(1),
      getCompletedCount: jest.fn().mockResolvedValue(45),
      getFailedCount: jest.fn().mockResolvedValue(0),
      getDelayedCount: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainQueueService,
        {
          provide: getQueueToken(BLOCKCHAIN_QUEUE_NAME),
          useValue: mockQueue,
        },
        {
          provide: PrismaService,
          useValue: {
            blockchainEvent: {
              create: jest.fn().mockImplementation(({ data }) =>
                Promise.resolve({
                  id: 'event-uuid-123',
                  ...data,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }),
              ),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BlockchainQueueService>(BlockchainQueueService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('queueMintReward', () => {
    it('should create a PENDING event in database and enqueue job to BullMQ', async () => {
      const recipient = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      const amount = 25.0;

      const result = await service.queueMintReward(recipient, amount);

      expect(result).toBeDefined();
      expect(result.jobId).toBe('job-12345');
      expect(result.event).toBeDefined();
      expect(result.event.status).toBe(BlockchainEventStatus.PENDING);
      expect(result.event.toAddress).toBe(recipient);
      expect(result.event.amount).toBe(amount);

      expect(prisma.blockchainEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            toAddress: recipient,
            amount: 25.0,
            status: BlockchainEventStatus.PENDING,
          }),
        }),
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        'mint-reward',
        expect.objectContaining({
          eventId: 'event-uuid-123',
          recipient,
          amount: 25.0,
        }),
        expect.objectContaining({
          attempts: 3,
        }),
      );
    });

    it('should throw BadRequestException if recipient is not a valid EVM address', async () => {
      await expect(
        service.queueMintReward('invalid-address', 10),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if amount is non-positive', async () => {
      const recipient = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      await expect(service.queueMintReward(recipient, 0)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.queueMintReward(recipient, -5)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getQueueStats', () => {
    it('should return aggregated BullMQ queue statistics', async () => {
      const stats = await service.getQueueStats();

      expect(stats).toEqual({
        waiting: 2,
        active: 1,
        completed: 45,
        failed: 0,
        delayed: 0,
      });
    });
  });
});
