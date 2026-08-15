import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';
import { BlockchainQueueService } from './blockchain-queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { BlockchainEventStatus } from '@prisma/client';

describe('BlockchainController', () => {
  let controller: BlockchainController;
  let blockchainService: BlockchainService;
  let blockchainQueueService: BlockchainQueueService;
  let prisma: PrismaService;

  const validAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockchainController],
      providers: [
        {
          provide: BlockchainService,
          useValue: {
            getStatus: jest.fn().mockResolvedValue({
              contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
              tokenName: 'CleanCity Reciclaje',
              tokenSymbol: 'RECI',
              network: 'Sepolia Testnet',
              chainId: 11155111,
              isConnected: true,
              isPaused: false,
              currentBatchId: 3,
            }),
            getBalance: jest.fn().mockResolvedValue({
              address: validAddress,
              balance: '150.0',
              symbol: 'RECI',
              decimals: 18,
              rawBalance: '150000000000000000000',
              isLive: true,
            }),
          },
        },
        {
          provide: BlockchainQueueService,
          useValue: {
            getQueueStats: jest.fn().mockResolvedValue({
              waiting: 0,
              active: 0,
              completed: 10,
              failed: 0,
              delayed: 0,
            }),
            queueMintReward: jest.fn().mockResolvedValue({
              event: {
                id: 'evt-123',
                toAddress: validAddress,
                amount: 30.0,
                status: BlockchainEventStatus.PENDING,
              },
              jobId: 'job-999',
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            blockchainEvent: {
              findMany: jest.fn().mockResolvedValue([
                {
                  id: 'evt-1',
                  toAddress: validAddress,
                  fromAddress: '0x0000000000000000000000000000000000000000',
                  amount: 15.0,
                  status: BlockchainEventStatus.CONFIRMED,
                  txHash: '0xabc123',
                  batchId: 'batch-1',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ]),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<BlockchainController>(BlockchainController);
    blockchainService = module.get<BlockchainService>(BlockchainService);
    blockchainQueueService = module.get<BlockchainQueueService>(BlockchainQueueService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStatus', () => {
    it('should return aggregated contract status and queue statistics', async () => {
      const status = await controller.getStatus();

      expect(status).toBeDefined();
      expect(status.contractAddress).toBe('0x5FbDB2315678afecb367f032d93F642f64180aa3');
      expect(status.tokenSymbol).toBe('RECI');
      expect(status.queue).toBeDefined();
      expect(status.queue.completed).toBe(10);
    });
  });

  describe('getBalance', () => {
    it('should return token balance for a valid EVM address', async () => {
      const result = await controller.getBalance(validAddress);

      expect(result).toBeDefined();
      expect(result.address).toBe(validAddress);
      expect(result.balance).toBe('150.0');
      expect(result.symbol).toBe('RECI');
    });

    it('should throw BadRequestException for invalid EVM address', async () => {
      await expect(controller.getBalance('invalid-eth-address')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getTransactions', () => {
    it('should return list of blockchain events for a valid address', async () => {
      const txs = await controller.getTransactions(validAddress);

      expect(txs).toBeDefined();
      expect(Array.isArray(txs)).toBe(true);
      expect(txs.length).toBe(1);
      expect(txs[0].toAddress).toBe(validAddress);
    });

    it('should throw BadRequestException for invalid EVM address', async () => {
      await expect(controller.getTransactions('bad-address')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('queueMint', () => {
    it('should enqueue minting reward and return 202 Accepted payload', async () => {
      const dto = {
        recipient: validAddress,
        amount: 30.0,
      };

      const response = await controller.queueMint(dto);

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.jobId).toBe('job-999');
      expect(response.event).toBeDefined();
      expect(response.event.toAddress).toBe(validAddress);

      expect(blockchainQueueService.queueMintReward).toHaveBeenCalledWith(
        validAddress,
        30.0,
        undefined,
      );
    });
  });
});
